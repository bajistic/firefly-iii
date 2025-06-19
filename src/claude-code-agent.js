const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(require('child_process').exec);
const { dbRunAsync, dbAllAsync } = require('./db');

class ClaudeCodeAgent {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Safety configuration
    this.DANGEROUS_OPERATIONS = {
      FILE_DELETE: ['rm', 'del', 'delete', 'remove', 'unlink'],
      FILE_MOVE: ['mv', 'move', 'rename'],
      DB_WRITE: ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE'],
      SYSTEM_CRITICAL: ['shutdown', 'reboot', 'kill', 'killall', 'pkill'],
    };
    
    this.SAFE_PATHS = [
      '/home/bayarbileg/jarvis/uploads',
      '/home/bayarbileg/jarvis/uploads/statements',
      '/home/bayarbileg/jarvis/temp',
      '/tmp'
    ];
  }

  /**
   * Execute administrative tasks using Claude Code capabilities
   * @param {Object} params - Task parameters
   * @param {string} params.task - The administrative task description
   * @param {string} params.type - Task type (file_management, analysis, maintenance, reporting)
   * @param {Object} params.context - Additional context for the task
   * @returns {Promise<Object>} Task execution results
   */
  async executeAdminTask({ task, type, context = {} }) {
    console.log(`🤖 ClaudeCodeAgent executing ${type} task: ${task}`);
    
    try {
      switch (type) {
        case 'file_management':
          return await this.handleFileManagement(task, context);
        case 'analysis':
          return await this.handleAnalysis(task, context);
        case 'maintenance':
          return await this.handleMaintenance(task, context);
        case 'reporting':
          return await this.handleReporting(task, context);
        default:
          return await this.handleGeneralTask(task, context);
      }
    } catch (error) {
      console.error('ClaudeCodeAgent error:', error);
      return {
        success: false,
        error: error.message,
        task,
        type
      };
    }
  }

  /**
   * Handle file management tasks
   */
  async handleFileManagement(task, context) {
    console.log('📁 Handling file management task');
    
    // Parse task to determine specific action
    const action = this.parseFileManagementAction(task);
    
    if (action.executable) {
      // Execute the action directly
      return await this.executeFileOperation(action.operation, action.targetPath, action.options);
    } else {
      // Fall back to AI guidance
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `I need help with file management in my finance system. 

Context: ${JSON.stringify(context, null, 2)}

Task: ${task}

Working directory: /home/bayarbileg/jarvis
Key directories:
- uploads/ (receipt images and PDFs)
- uploads/statements/ (bank statements)
- src/ (application code)

Please provide specific, executable actions for this file management task. If possible, suggest specific file operations that can be automated.`
        }]
      });

      return {
        success: true,
        result: message.content[0].text,
        task,
        type: 'file_management',
        suggestions: this.extractActionSuggestions(message.content[0].text),
        executable: false
      };
    }
  }

  /**
   * Handle analysis tasks
   */
  async handleAnalysis(task, context) {
    console.log('📊 Handling analysis task');
    
    // For analysis, we might need to read files or logs
    let analysisData = '';
    
    // Check if we need to analyze error logs
    if (task.toLowerCase().includes('error') || task.toLowerCase().includes('log')) {
      try {
        const errorLogPath = '/home/bayarbileg/jarvis/error.log';
        const logData = await fs.readFile(errorLogPath, 'utf8');
        // Get last 100 lines for analysis
        const lines = logData.split('\n');
        analysisData = lines.slice(-100).join('\n');
      } catch (error) {
        console.log('Could not read error log:', error.message);
      }
    }

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `I need analysis help for my finance system.

Context: ${JSON.stringify(context, null, 2)}

Task: ${task}

${analysisData ? `Recent log data:\n${analysisData}` : ''}

Please analyze the situation and provide insights, patterns, or recommendations. Focus on actionable findings.`
      }]
    });

    return {
      success: true,
      result: message.content[0].text,
      task,
      type: 'analysis',
      insights: this.extractInsights(message.content[0].text)
    };
  }

  /**
   * Handle system maintenance tasks
   */
  async handleMaintenance(task, context) {
    console.log('🔧 Handling maintenance task');
    
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `I need help with system maintenance for my finance system.

Context: ${JSON.stringify(context, null, 2)}

Task: ${task}

System details:
- Node.js application with Express server
- MariaDB database (finance schema)
- File uploads in uploads/ directory
- Telegram bot integration
- Running on Linux

Please provide specific maintenance steps, commands, or recommendations. Focus on safe, proven maintenance practices.`
      }]
    });

    return {
      success: true,
      result: message.content[0].text,
      task,
      type: 'maintenance',
      actions: this.extractMaintenanceActions(message.content[0].text)
    };
  }

  /**
   * Handle reporting tasks
   */
  async handleReporting(task, context) {
    console.log('📋 Handling reporting task');
    
    // Parse task to see if we can execute specific reports
    const reportAction = this.parseReportingAction(task);
    
    if (reportAction.executable) {
      // Execute the report query directly
      const queryResult = await this.executeDatabaseQuery(reportAction.query, reportAction.params);
      
      if (queryResult.success) {
        return {
          success: true,
          task,
          type: 'reporting',
          queryExecuted: true,
          data: queryResult.result,
          rowCount: queryResult.rowCount,
          message: `Generated ${reportAction.reportType} report with ${queryResult.rowCount} records`
        };
      } else {
        return queryResult; // Return the error from query execution
      }
    } else {
      // Fall back to AI guidance with SQL generation
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `I need help generating reports for my finance system.

Context: ${JSON.stringify(context, null, 2)}

Task: ${task}

Database schema available:
- transactions: id, shop, date, time, total, currency, receipt_path, account_id, receipt_number
- items: id, transaction_id, name, quantity, price, category
- income: id, type, amount, date, description, account_id
- accounts: id, name, description, type, balance

Please provide executable SQL queries for this reporting task. Focus on SELECT queries that I can run immediately.`
        }]
      });

      const extractedQueries = this.extractSQLQueries(message.content[0].text);
      
      return {
        success: true,
        result: message.content[0].text,
        task,
        type: 'reporting',
        queries: extractedQueries,
        executable: false
      };
    }
  }

  /**
   * Handle general administrative tasks
   */
  async handleGeneralTask(task, context) {
    console.log('⚙️ Handling general administrative task');
    
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `I need administrative help with my finance system.

Context: ${JSON.stringify(context, null, 2)}

Task: ${task}

This is a personal finance assistant with:
- Receipt scanning via Telegram/web
- Bank statement reconciliation
- Real-time dashboard
- Automated email monitoring
- Agentic task execution

Please provide practical guidance or steps to complete this administrative task.`
      }]
    });

    return {
      success: true,
      result: message.content[0].text,
      task,
      type: 'general',
      recommendations: this.extractRecommendations(message.content[0].text)
    };
  }

  /**
   * Extract actionable suggestions from Claude's response
   */
  extractActionSuggestions(text) {
    const suggestions = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('```bash') || line.includes('```sh')) {
        // Extract bash commands
        const match = text.match(/```(?:bash|sh)\n(.*?)\n```/gs);
        if (match) {
          suggestions.push(...match.map(m => m.replace(/```(?:bash|sh)\n|\n```/g, '')));
        }
      }
      
      // Look for numbered steps or bullet points
      if (line.match(/^\d+\./) || line.match(/^[-*]\s/)) {
        suggestions.push(line.trim());
      }
    }
    
    return suggestions;
  }

  /**
   * Extract insights from analysis
   */
  extractInsights(text) {
    const insights = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('insight') || 
          line.toLowerCase().includes('pattern') ||
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('suggest')) {
        insights.push(line.trim());
      }
    }
    
    return insights;
  }

  /**
   * Extract maintenance actions
   */
  extractMaintenanceActions(text) {
    return this.extractActionSuggestions(text);
  }

  /**
   * Extract SQL queries from text
   */
  extractSQLQueries(text) {
    const queries = [];
    const sqlMatches = text.match(/```sql\n(.*?)\n```/gs);
    
    if (sqlMatches) {
      queries.push(...sqlMatches.map(match => 
        match.replace(/```sql\n|\n```/g, '').trim()
      ));
    }
    
    return queries;
  }

  /**
   * Extract general recommendations
   */
  extractRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.match(/^\d+\./) || line.match(/^[-*]\s/) || 
          line.toLowerCase().includes('recommend') ||
          line.toLowerCase().includes('suggest') ||
          line.toLowerCase().includes('should')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations;
  }

  // ===== ENHANCED EXECUTION CAPABILITIES =====

  /**
   * Execute file system operations with safety checks
   */
  async executeFileOperation(operation, targetPath, options = {}) {
    console.log(`📁 Executing file operation: ${operation} on ${targetPath}`);
    
    // Safety check: ensure path is within safe directories
    const isPathSafe = this.SAFE_PATHS.some(safePath => 
      path.resolve(targetPath).startsWith(path.resolve(safePath))
    );
    
    if (!isPathSafe) {
      return {
        success: false,
        error: `Path ${targetPath} is outside safe directories`,
        requiresConfirmation: true
      };
    }

    // Check if operation is dangerous
    const isDangerous = this.isDangerousFileOperation(operation);
    
    if (isDangerous && !options.confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        confirmationMessage: `⚠️ DANGEROUS OPERATION: ${operation} on ${targetPath}. This cannot be undone. Confirm?`,
        operation,
        targetPath,
        options
      };
    }

    try {
      let result;
      
      switch (operation.toLowerCase()) {
        case 'list':
        case 'ls':
          const files = await fs.readdir(targetPath, { withFileTypes: true });
          result = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            isFile: file.isFile()
          }));
          break;
          
        case 'organize_by_date':
          result = await this.organizeFilesByDate(targetPath);
          break;
          
        case 'find_duplicates':
          result = await this.findDuplicateFiles(targetPath);
          break;
          
        case 'backup':
          result = await this.backupDirectory(targetPath, options.backupPath);
          break;
          
        case 'clean_old_files':
          result = await this.cleanOldFiles(targetPath, options.days || 365);
          break;
          
        default:
          return {
            success: false,
            error: `Unsupported file operation: ${operation}`
          };
      }
      
      return {
        success: true,
        operation,
        targetPath,
        result,
        message: `Successfully executed ${operation} on ${targetPath}`
      };
      
    } catch (error) {
      console.error(`File operation error:`, error);
      return {
        success: false,
        error: error.message,
        operation,
        targetPath
      };
    }
  }

  /**
   * Execute database queries with safety checks
   */
  async executeDatabaseQuery(query, params = [], options = {}) {
    console.log(`🗄️ Executing database query:`, query.substring(0, 100) + '...');
    
    const queryType = this.getDatabaseQueryType(query);
    const isDangerous = this.DANGEROUS_OPERATIONS.DB_WRITE.includes(queryType);
    
    if (isDangerous && !options.confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        confirmationMessage: `⚠️ DANGEROUS DATABASE OPERATION: ${queryType} query. This will modify data. Confirm?`,
        query,
        params,
        queryType
      };
    }

    try {
      let result;
      
      if (queryType === 'SELECT') {
        result = await dbAllAsync(query, params);
      } else {
        result = await dbRunAsync(query, params);
      }
      
      return {
        success: true,
        queryType,
        result,
        rowCount: Array.isArray(result) ? result.length : result.changes,
        message: `Successfully executed ${queryType} query`
      };
      
    } catch (error) {
      console.error(`Database query error:`, error);
      return {
        success: false,
        error: error.message,
        query: query.substring(0, 100) + '...',
        queryType
      };
    }
  }

  /**
   * Execute system commands with safety restrictions
   */
  async executeSystemCommand(command, options = {}) {
    console.log(`⚙️ Executing system command:`, command);
    
    // Block dangerous commands
    if (this.isDangerousSystemCommand(command)) {
      return {
        success: false,
        error: `Command blocked for safety: ${command}`,
        requiresConfirmation: true,
        confirmationMessage: `⚠️ CRITICAL SYSTEM COMMAND: ${command}. This could affect system stability. Confirm?`
      };
    }

    // Require confirmation for potentially dangerous commands
    const needsConfirmation = this.commandNeedsConfirmation(command);
    if (needsConfirmation && !options.confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        confirmationMessage: `⚠️ System command requires confirmation: ${command}`,
        command
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: '/home/bayarbileg/jarvis',
        timeout: options.timeout || 30000 // 30 second default timeout
      });
      
      return {
        success: true,
        command,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        message: `Successfully executed: ${command}`
      };
      
    } catch (error) {
      console.error(`System command error:`, error);
      return {
        success: false,
        error: error.message,
        command,
        stdout: error.stdout?.trim(),
        stderr: error.stderr?.trim()
      };
    }
  }

  // ===== SAFETY CHECK METHODS =====

  isDangerousFileOperation(operation) {
    const dangerous = [
      ...this.DANGEROUS_OPERATIONS.FILE_DELETE,
      ...this.DANGEROUS_OPERATIONS.FILE_MOVE
    ];
    return dangerous.some(dangerousOp => 
      operation.toLowerCase().includes(dangerousOp.toLowerCase())
    );
  }

  isDangerousSystemCommand(command) {
    return this.DANGEROUS_OPERATIONS.SYSTEM_CRITICAL.some(dangerous => 
      command.toLowerCase().includes(dangerous.toLowerCase())
    );
  }

  commandNeedsConfirmation(command) {
    const confirmationTriggers = ['rm ', 'mv ', 'cp ', 'chmod ', 'chown ', 'sudo '];
    return confirmationTriggers.some(trigger => 
      command.toLowerCase().includes(trigger)
    );
  }

  getDatabaseQueryType(query) {
    const trimmed = query.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('CREATE')) return 'CREATE';
    if (trimmed.startsWith('DROP')) return 'DROP';
    if (trimmed.startsWith('ALTER')) return 'ALTER';
    return 'UNKNOWN';
  }

  // ===== SPECIFIC FILE OPERATIONS =====

  async organizeFilesByDate(directoryPath) {
    const files = await fs.readdir(directoryPath);
    const organized = [];
    
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        const date = stats.mtime.toISOString().split('T')[0]; // YYYY-MM-DD
        const dateDir = path.join(directoryPath, date);
        
        // Create date directory if it doesn't exist
        await fs.mkdir(dateDir, { recursive: true });
        
        // Move file to date directory
        const newPath = path.join(dateDir, file);
        await fs.rename(filePath, newPath);
        
        organized.push({
          originalPath: filePath,
          newPath,
          date
        });
      }
    }
    
    return organized;
  }

  async findDuplicateFiles(directoryPath) {
    const files = await fs.readdir(directoryPath, { recursive: true });
    const fileMap = new Map();
    const duplicates = [];
    
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        const key = `${stats.size}-${path.basename(file)}`;
        
        if (fileMap.has(key)) {
          duplicates.push({
            original: fileMap.get(key),
            duplicate: filePath,
            size: stats.size
          });
        } else {
          fileMap.set(key, filePath);
        }
      }
    }
    
    return duplicates;
  }

  async backupDirectory(sourcePath, backupPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTarget = backupPath || `${sourcePath}_backup_${timestamp}`;
    
    const command = `cp -r "${sourcePath}" "${backupTarget}"`;
    const result = await execAsync(command);
    
    return {
      sourcePath,
      backupPath: backupTarget,
      timestamp,
      command
    };
  }

  async cleanOldFiles(directoryPath, days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const files = await fs.readdir(directoryPath);
    const cleaned = [];
    
    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile() && stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        cleaned.push({
          path: filePath,
          lastModified: stats.mtime,
          size: stats.size
        });
      }
    }
    
    return cleaned;
  }

  // ===== ACTION PARSING METHODS =====

  parseFileManagementAction(task) {
    const taskLower = task.toLowerCase();
    
    // Organize files by date
    if (taskLower.includes('organize') && taskLower.includes('date')) {
      return {
        executable: true,
        operation: 'organize_by_date',
        targetPath: '/home/bayarbileg/jarvis/uploads',
        options: {}
      };
    }
    
    // Find duplicates
    if (taskLower.includes('duplicate') || taskLower.includes('find duplicate')) {
      return {
        executable: true,
        operation: 'find_duplicates',
        targetPath: '/home/bayarbileg/jarvis/uploads',
        options: {}
      };
    }
    
    // List files
    if (taskLower.includes('list') && taskLower.includes('file')) {
      return {
        executable: true,
        operation: 'list',
        targetPath: '/home/bayarbileg/jarvis/uploads',
        options: {}
      };
    }
    
    // Backup
    if (taskLower.includes('backup')) {
      return {
        executable: true,
        operation: 'backup',
        targetPath: '/home/bayarbileg/jarvis/uploads',
        options: {}
      };
    }
    
    // Clean old files
    if (taskLower.includes('clean') && (taskLower.includes('old') || taskLower.includes('older'))) {
      const daysMatch = taskLower.match(/(\d+)\s*days?/);
      const days = daysMatch ? parseInt(daysMatch[1]) : 365;
      
      return {
        executable: true,
        operation: 'clean_old_files',
        targetPath: '/home/bayarbileg/jarvis/uploads',
        options: { days }
      };
    }
    
    return { executable: false };
  }

  parseReportingAction(task) {
    const taskLower = task.toLowerCase();
    
    // Monthly spending report
    if (taskLower.includes('monthly') && (taskLower.includes('spending') || taskLower.includes('expense'))) {
      return {
        executable: true,
        reportType: 'monthly_spending',
        query: `
          SELECT 
            DATE_FORMAT(date, '%Y-%m') as month,
            COUNT(*) as transaction_count,
            SUM(total) as total_spent,
            AVG(total) as average_transaction
          FROM transactions 
          WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')
          GROUP BY DATE_FORMAT(date, '%Y-%m')
        `,
        params: []
      };
    }
    
    // Category breakdown
    if (taskLower.includes('category') && (taskLower.includes('breakdown') || taskLower.includes('spending'))) {
      return {
        executable: true,
        reportType: 'category_breakdown',
        query: `
          SELECT 
            i.category,
            SUM(i.price * i.quantity) as total_spent,
            COUNT(*) as item_count,
            ROUND((SUM(i.price * i.quantity) / (
              SELECT SUM(price * quantity) FROM items i2 
              JOIN transactions t2 ON i2.transaction_id = t2.id 
              WHERE DATE_FORMAT(t2.date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')
            )) * 100, 2) as percentage
          FROM items i
          JOIN transactions t ON i.transaction_id = t.id
          WHERE DATE_FORMAT(t.date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')
          GROUP BY i.category
          ORDER BY total_spent DESC
        `,
        params: []
      };
    }
    
    // Recent transactions
    if (taskLower.includes('recent') && taskLower.includes('transaction')) {
      const limitMatch = taskLower.match(/(\d+)/);
      const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
      
      return {
        executable: true,
        reportType: 'recent_transactions',
        query: `
          SELECT 
            shop, 
            date, 
            total, 
            currency,
            receipt_number
          FROM transactions 
          ORDER BY date DESC, id DESC 
          LIMIT ?
        `,
        params: [limit]
      };
    }
    
    // Top merchants
    if (taskLower.includes('top') && (taskLower.includes('merchant') || taskLower.includes('shop'))) {
      return {
        executable: true,
        reportType: 'top_merchants',
        query: `
          SELECT 
            shop,
            COUNT(*) as visit_count,
            SUM(total) as total_spent,
            AVG(total) as average_spent
          FROM transactions
          WHERE DATE_FORMAT(date, '%Y-%m') = DATE_FORMAT(CURRENT_DATE, '%Y-%m')
          GROUP BY shop
          ORDER BY total_spent DESC
          LIMIT 10
        `,
        params: []
      };
    }
    
    return { executable: false };
  }
}

module.exports = ClaudeCodeAgent;