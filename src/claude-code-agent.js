const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

class ClaudeCodeAgent {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
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
    
    // Create a Claude Code conversation for file operations
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

Please provide specific commands or actions I should take to complete this file management task. Focus on practical, safe operations.`
      }]
    });

    return {
      success: true,
      result: message.content[0].text,
      task,
      type: 'file_management',
      suggestions: this.extractActionSuggestions(message.content[0].text)
    };
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

Please provide SQL queries, report structure, or analysis approach for this reporting task.`
      }]
    });

    return {
      success: true,
      result: message.content[0].text,
      task,
      type: 'reporting',
      queries: this.extractSQLQueries(message.content[0].text)
    };
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
}

module.exports = ClaudeCodeAgent;