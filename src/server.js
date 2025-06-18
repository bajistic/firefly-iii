const express = require('express');
const axios = require('axios');
const { authenticate, ensureValidToken } = require('./auth');
const { createEvent, listEvents, deleteEvent } = require('./calendar');
const { createCoverLetter } = require('./coverletter');
const { sendEmail, listMessages, getMessage, modifyMessage } = require('./gmail');
const { scrapeJobs } = require('./scraper');
const path = require('path');
const os = require('os'); // For fetching network interfaces
const fs = require('fs').promises;
// const open = require('open');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();
const OpenAI = require('openai');
const { systemPromptTemplate, interpreterPrompt, coverLetterPrompt } = require('./prompts');
const { tools: toolsSchema, CoverLetterJsonSchema } = require('./schemas');
const { zodToJsonSchema } = require('zod-to-json-schema');
const { UnifiedActionSchema } = require('./zodschemas')
const z = require('zod');
const { bot } = require('./telegram');
const { originalLog } = require('./console');
const TelegramBot = require('node-telegram-bot-api');

const { pool: db } = require('./db');
const {
  verifySignature,
  handleWebhook,
  createFireflyTransaction,
  createFireflyIncomeTransaction,
  createFireflyAccount,
  createSyncedTransaction,
  createSyncedIncome,
} = require('./firefly');
const {
  parseBankStatement,
  matchTransactions,
  applyReconciliation
} = require('./reconciliation');
const { startEmailMonitoring } = require('./email-receipts');
const multer = require('multer');
const sharp = require('sharp');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });
// Promisified database access using MySQL pool
const dbRunAsync = async (sql, params = []) => {
  const [result] = await db.execute(sql, params);
  return { lastID: result.insertId, changes: result.affectedRows };
};

const dbAllAsync = async (sql, params = []) => {
  const [rows] = await db.query(sql, params);
  return rows;
};

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all interfaces
const TAILSCALE_IP = process.env.TAILSCALE_IP || getTailscaleIP() || 'unknown'; // Fallback to dynamic IP or 'unknown'
const DB_NAME = process.env.DB_NAME;
const DOSSIER_PATH = path.join(__dirname, 'dossier.md');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
];

let conversationHistory = [];
const MAX_HISTORY_TURNS = 20; // Store last 5 user/assistant turn pairs
let CURRENT_DB_SCHEMA = "Schema not yet loaded.";
const MIGRATIONS_LOG_PATH = path.join(__dirname, 'proposed_migrations.log');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

let botInstance; // To hold the bot instance

if (TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID) {
  try {
    botInstance = new TelegramBot(TELEGRAM_BOT_TOKEN); // No polling if bot logic is in telegram.js
    console.log("\x1b[32m[SRV]\x1b[0m Telegram logging bot initialized for admin chat.");
  } catch (e) {
    console.error("\x1b[31m[ERR]\x1b[0m Failed to initialize Telegram logging bot:", e.message);
    botInstance = null; // Ensure it's null if init fails
  }
} else {
  console.warn("\x1b[33m[WARN]\x1b[0m TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set. Telegram logging for non-Telegram interactions will be disabled.");
  botInstance = null;
}

// Function to send a log message to your admin Telegram chat
async function logToAdminTelegram(message, origin = "API") {
  if (botInstance && TELEGRAM_ADMIN_CHAT_ID) {
    try {
      // Add an identifier to distinguish API logs from direct bot interactions
      const formattedMessage = `*[${origin}]*\n${message}`;
      await botInstance.sendMessage(TELEGRAM_ADMIN_CHAT_ID, formattedMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error(`\x1b[31m[ERR]\x1b[0m Failed to send log to Admin Telegram:`, error.message);
    }
  }
}

// Function to dynamically fetch Tailscale IP
function getTailscaleIP() {
  const interfaces = os.networkInterfaces();
  for (const iface in interfaces) {
    for (const addr of interfaces[iface]) {
      if (addr.address.startsWith('100.')) {
        return addr.address; // Return first Tailscale IP (e.g., 100.115.178.34)
      }
    }
  }
  return null; // No Tailscale IP found
};

/**
 * Fetches the Data Definition Language (DDL) SQL statements for all user-defined
 * tables in the connected MariaDB database.
 * @param {import('mysql2/promise').Pool} dbInstance - The mysql2 promise-based Pool instance.
 * @returns {Promise<string>} A promise that resolves with a single string containing
 *                            all DDL statements, separated by two newlines.
 */
async function getDatabaseSchemaDDL(dbInstance) {
  const [tables] = await dbInstance.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
    [DB_NAME]
  );
  const schemaSQLs = [];
  for (const row of tables) {
    const tableName = row.TABLE_NAME || row.table_name;
    const [createRows] = await dbInstance.query(`SHOW CREATE TABLE \`${tableName}\``);
    if (createRows.length > 0 && createRows[0]['Create Table']) {
      schemaSQLs.push(createRows[0]['Create Table'] + ';');
    }
  }
  return schemaSQLs.join('\n\n');
}

// Function to initialize/update the schema string (call at startup and potentially if schema changes)
async function loadDbSchemaIntoPrompt() {
  try {
    CURRENT_DB_SCHEMA = await getDatabaseSchemaDDL(db);
    console.log("Database schema DDL loaded successfully.");
    // console.log("Current DB Schema DDL:\n", CURRENT_DB_SCHEMA); // For debugging
  } catch (error) {
    console.error("FATAL: Failed to load database schema DDL:", error);
    CURRENT_DB_SCHEMA = "Error: Could not load database schema. AI database operations will be impaired.";
    // Potentially exit or disable DB-related AI features if schema is critical
  }
}

async function addTodoToThings(todo) {
  const { title, notes = '', checklist = [], dueDate = '' } = todo;
  let url = `things:///add?title=${encodeURIComponent(title)}&notes=${encodeURIComponent(notes)}`;

  if (checklist.length > 0) {
    url += `&checklist-items=${encodeURIComponent(checklist.join('\n'))}`;
  }
  if (dueDate) {
    url += `&when=${encodeURIComponent(dueDate)}`;
  }

  console.log(`Opening Things URL: ${url}`); // Debug log
  try {
    await execPromise(`open "${url}"`);
    return { success: true, message: `Added to-do: ${title}\n URL: ${url}` };
  } catch (err) {
    console.error(`Error opening Things URL: ${err.message}`); // Debug log
    return { success: false, error: `Failed to add ${title}: ${err.message}` };
  }
}

app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    tailscale_ip: TAILSCALE_IP,
    conversation_history_length: conversationHistory.length, // How many pairs
    db_schema_loaded: !CURRENT_DB_SCHEMA.startsWith("Error") && CURRENT_DB_SCHEMA !== "Schema not yet loaded."
  });
});

// Dashboard routes
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/dashboard-data', async (req, res) => {
  try {
    // Get transactions with items
    const transactions = await dbAllAsync(`
      SELECT 
        t.id,
        t.shop,
        t.date,
        t.time,
        t.total,
        t.currency,
        t.receipt_path
      FROM transactions t
      ORDER BY t.date DESC, t.time DESC
      LIMIT 100
    `);

    // Get items for each transaction
    for (const transaction of transactions) {
      const items = await dbAllAsync(`
        SELECT name, quantity, price, category
        FROM items
        WHERE transaction_id = ?
      `, [transaction.id]);
      transaction.items = items;
    }

    // Calculate summary statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const monthTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth);
    const weekTransactions = transactions.filter(t => new Date(t.date) >= startOfWeek);
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= lastMonth && date <= endOfLastMonth;
    });

    const monthTotal = monthTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const weekTotal = weekTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const avgTransaction = transactions.length > 0 ? transactions.reduce((sum, t) => sum + parseFloat(t.total), 0) / transactions.length : 0;

    const monthChange = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;

    // Get category data for chart
    const categoryData = {};
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const category = item.category || 'other';
        categoryData[category] = (categoryData[category] || 0) + parseFloat(item.price || 0);
      });
    });

    const summary = {
      monthTotal,
      weekTotal,
      avgTransaction,
      totalTransactions: transactions.length,
      monthChange: Math.round(monthChange * 100) / 100
    };

    const chartData = {
      labels: Object.keys(categoryData),
      data: Object.values(categoryData)
    };

    res.json({
      transactions,
      summary,
      chartData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Reconciliation routes
app.get('/reconciliation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reconciliation.html'));
});

// Upload and process bank statement
const statementUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/statements/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.post('/api/reconcile-statement', statementUpload.single('statement'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`Processing bank statement: ${req.file.filename}`);

    // Parse bank statement PDF
    const parseResult = await parseBankStatement(req.file.path);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Failed to parse PDF', 
        details: parseResult.error 
      });
    }

    console.log(`Extracted ${parseResult.transactions.length} transactions from PDF`);

    // Match transactions with database
    const matchResult = await matchTransactions(parseResult.transactions);

    console.log(`Matching results: ${matchResult.summary.matched} matched, ${matchResult.summary.discrepancies} discrepancies, ${matchResult.summary.unmatched} unmatched`);

    // Add metadata
    const result = {
      ...matchResult,
      statementInfo: {
        filename: req.file.originalname,
        uploadDate: new Date().toISOString(),
        pages: parseResult.metadata?.pages || 'Unknown'
      }
    };

    res.json(result);

  } catch (error) {
    console.error('Reconciliation error:', error);
    res.status(500).json({ 
      error: 'Failed to process bank statement', 
      details: error.message 
    });
  }
});

// Apply reconciliation corrections
app.post('/api/apply-reconciliation', async (req, res) => {
  try {
    const { changes } = req.body;
    
    if (!changes || !Array.isArray(changes)) {
      return res.status(400).json({ error: 'Invalid changes data' });
    }

    console.log(`Applying ${changes.length} reconciliation changes`);

    const results = await applyReconciliation('manual', changes);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Applied ${successful.length}/${results.length} changes successfully`);

    res.json({
      success: failed.length === 0,
      applied: successful.length,
      failed: failed.length,
      results: successful,
      errors: failed
    });

  } catch (error) {
    console.error('Apply reconciliation error:', error);
    res.status(500).json({ 
      error: 'Failed to apply changes', 
      details: error.message 
    });
  }
});

// Email Receipt Processing API endpoints
app.get('/api/check-receipts', async (req, res) => {
  try {
    const { checkForReceiptEmails } = require('./email-receipts');
    await checkForReceiptEmails();
    res.json({ 
      success: true, 
      message: 'Receipt check triggered successfully' 
    });
  } catch (error) {
    console.error('Manual receipt check error:', error);
    res.status(500).json({ 
      error: 'Failed to start receipt check', 
      details: error.message 
    });
  }
});

app.get('/api/receipt-senders', (req, res) => {
  const { KNOWN_RECEIPT_SENDERS } = require('./email-receipts');
  res.json({
    senders: KNOWN_RECEIPT_SENDERS,
    count: KNOWN_RECEIPT_SENDERS.length
  });
});

// Manual Receipt Processing API
app.post('/api/process-receipt', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const command = req.body.command || 'Process this receipt';
    const originalFilename = req.file.originalname;
    const uploadedFilePath = req.file.path;
    const mimeType = req.file.mimetype;

    console.log(`📄 Manual receipt processing: ${originalFilename} (${mimeType})`);

    // Use the same processing logic as the main AI endpoint
    let finalReceiptPathForDB = uploadedFilePath;
    let extractedText = '';

    // Handle PDF files
    if (mimeType === 'application/pdf') {
      console.log(`🔍 Processing PDF receipt: ${originalFilename}`);
      try {
        const pdf = require('pdf-parse');
        const pdfBuffer = await fs.readFile(uploadedFilePath);
        const pdfData = await pdf(pdfBuffer);
        
        if (pdfData.text && pdfData.text.trim().length > 0) {
          extractedText = pdfData.text.trim();
          console.log(`📄 Extracted ${extractedText.length} characters from PDF`);
        } else {
          console.log(`⚠️ No text found in PDF`);
        }
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError.message);
        return res.status(400).json({ 
          error: 'Failed to process PDF', 
          details: pdfError.message 
        });
      }
    } else if (mimeType.startsWith('image/')) {
      // Handle image files (convert to JPEG if needed)
      const needsConversion = !['image/jpeg', 'image/jpg'].includes(mimeType.toLowerCase());
      
      if (needsConversion) {
        console.log(`🔄 Converting ${mimeType} to JPEG`);
        const parsedPath = path.parse(uploadedFilePath);
        const jpegPath = path.join(parsedPath.dir, `${parsedPath.name}.jpg`);
        
        await sharp(uploadedFilePath).jpeg().toFile(jpegPath);
        finalReceiptPathForDB = jpegPath;
        
        // Delete original if different
        if (uploadedFilePath !== jpegPath) {
          await fs.unlink(uploadedFilePath).catch(console.warn);
        }
      }
    } else {
      return res.status(400).json({ 
        error: 'Unsupported file type', 
        details: 'Please upload PDF, JPG, PNG, or HEIC files' 
      });
    }

    // Use AI to process the content
    const { extractTransactionFromPDF, createTransactionFromEmail } = require('./email-receipts');
    
    let result = { success: false, message: 'Processing failed' };
    
    if (mimeType === 'application/pdf' && extractedText) {
      // Process PDF with AI
      const emailInfo = {
        from: 'Manual Upload',
        subject: `Manual Receipt: ${originalFilename}`
      };
      
      const transactionData = await extractTransactionFromPDF(finalReceiptPathForDB, emailInfo);
      if (transactionData && transactionData.confidence >= 60) {
        const createResult = await createTransactionFromEmail(transactionData, finalReceiptPathForDB, emailInfo);
        if (createResult.success) {
          result = {
            success: true,
            message: `✅ Created transaction: ${createResult.shop} - ${createResult.total} ${createResult.currency}`,
            transaction: createResult,
            confidence: transactionData.confidence,
            source: 'manual_upload'
          };
        } else {
          result = {
            success: false,
            message: `❌ Failed to create transaction: ${createResult.error}`,
            extracted_data: transactionData,
            confidence: transactionData.confidence
          };
        }
      } else if (transactionData) {
        result = {
          success: false,
          message: `⚠️ Low confidence (${transactionData.confidence}%) - manual review required`,
          extracted_data: transactionData,
          confidence: transactionData.confidence,
          requires_review: true
        };
      } else {
        result = {
          success: false,
          message: '❌ Could not extract transaction data from PDF'
        };
      }
    } else {
      // For images, use the existing AI processing pipeline
      const messagesToOpenAI = [
        {
          role: 'system',
          content: 'You are a receipt processing assistant. Extract transaction details from the uploaded receipt.'
        },
        {
          role: 'user',
          content: `${command} - Receipt file: ${originalFilename}`
        }
      ];

      // This would integrate with existing AI processing...
      result = {
        success: true,
        message: `📄 Receipt uploaded successfully: ${originalFilename}`,
        note: 'Image processing - would integrate with existing AI pipeline for full extraction'
      };
    }

    console.log(`✅ Manual receipt processing completed: ${result.message}`);
    res.json(result);

  } catch (error) {
    console.error('Manual receipt processing error:', error);
    res.status(500).json({ 
      error: 'Processing failed', 
      details: error.message 
    });
  }
});

// Firefly webhook endpoint for two-way sync
app.post('/webhook/firefly', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.header('X-Hook-Signature') || req.header('X-Firefly-Signature');
  if (!verifySignature(signature, req.body)) {
    console.warn('Invalid Firefly webhook signature');
    return res.status(401).send('Invalid signature');
  }
  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Failed to parse Firefly webhook payload:', err.message);
    return res.status(400).send('Bad Request');
  }
  try {
    await handleWebhook(event);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling Firefly webhook:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/ai/natural', upload.single('image'), async (req, res) => {
  const { command } = req.body;
  const isTelegramOrigin = req.headers['x-telegram-origin'] === 'true'; // Custom header
  if (!command) return res.status(400).json({ error: 'Command is required' });
  console.log('Received command:', command);

  let results = [];
  let base64ImageForHistoryAndProcessing = null; // For receipt image data
  let finalReceiptPathForDB = null;
  let currentTurnUserMessages = []; // To store user messages for this specific turn
  let aiDecision; // To make it accessible in catch if needed for logging


  try {
    // Ensure schema is available (non-blocking; failures will be noted in prompt)
    if (CURRENT_DB_SCHEMA === "Schema not yet loaded." || CURRENT_DB_SCHEMA.startsWith("Error")) {
      await loadDbSchemaIntoPrompt();
    }
    const populatedSystemPrompt = systemPromptTemplate.replace('{{DB_SCHEMA}}', CURRENT_DB_SCHEMA);

    // Step 1: Construct messages for OpenAI, including history
    const messagesToOpenAI = [{ role: 'system', content: populatedSystemPrompt }];

    // Add historical messages (flattened user/assistant pairs)
    conversationHistory.forEach(turn => {
      messagesToOpenAI.push(turn.user);
      if (turn.assistant) { // Assistant might not exist if a previous turn failed before summary
        messagesToOpenAI.push(turn.assistant);
      }
    });

    const userCommandMessage = { role: 'user', content: command };
    messagesToOpenAI.push(userCommandMessage);
    currentTurnUserMessages.push(userCommandMessage); // For history

    let uploadedFilePathForTransaction = null;
    if (req.file) {
      const uploadedFilePath = req.file.path;         // Path where multer saved the file
      const originalFilename = req.file.originalname; // Original filename from upload
      const mimeType = req.file.mimetype;           // MIME type (e.g., 'image/jpeg', 'image/png', 'image/heic')

      console.log(`\x1b[32m[IMG]\x1b[0m Received file: ${originalFilename}, MIME type: ${mimeType}, Saved at: ${uploadedFilePath}`);

      // Handle PDF files  
      if (mimeType === 'application/pdf') {
        console.log(`\x1b[32m[PDF]\x1b[0m Processing PDF receipt: ${originalFilename}`);
        try {
          // Extract raw text from PDF for receipt processing
          const pdf = require('pdf-parse');
          const pdfBuffer = await fs.readFile(uploadedFilePath);
          const pdfData = await pdf(pdfBuffer);
          
          if (pdfData.text && pdfData.text.trim().length > 0) {
            console.log(`\x1b[32m[PDF]\x1b[0m Successfully extracted text from PDF (${pdfData.text.length} chars)`);
            
            // Send PDF text content to OpenAI for processing
            const userPdfMessage = { 
              role: 'user', 
              content: `${command} - PDF Receipt Content:\n\n${pdfData.text.trim()}\n\nPlease extract the shop name, date, total amount, currency, and itemized list from this receipt.` 
            };
            messagesToOpenAI.push(userPdfMessage);
            finalReceiptPathForDB = uploadedFilePath; // Store PDF path
          } else {
            console.log(`\x1b[33m[PDF]\x1b[0m No text content found in PDF`);
            const userPdfMessage = { 
              role: 'user', 
              content: `${command} - PDF document uploaded: ${originalFilename} (no readable text found)` 
            };
            messagesToOpenAI.push(userPdfMessage);
          }
        } catch (pdfError) {
          console.error('\x1b[31m[ERR]\x1b[0m PDF processing error:', pdfError.message);
          const userPdfMessage = { 
            role: 'user', 
            content: `${command} - PDF document uploaded: ${originalFilename} (processing failed: ${pdfError.message})` 
          };
          messagesToOpenAI.push(userPdfMessage);
        }
      } 
      // Handle image files
      else {
        // Check if conversion is needed
        // We want JPEG as the final format.
        // Convert if it's HEIC, HEIF, PNG, or other common non-JPEG image types.
        // 'image/jpg' is sometimes used instead of 'image/jpeg'.
        const needsConversionToJpeg = ![
          'image/jpeg',
          'image/jpg'
        ].includes(mimeType.toLowerCase());

        if (needsConversionToJpeg) {
          console.log(`\x1b[32m[IMG]\x1b[0m File type (${mimeType}) requires conversion to JPEG.`);
          const parsedPath = path.parse(uploadedFilePath); // Parse the path multer saved it to
          const jpegOutputFilename = `${parsedPath.name}.jpg`; // Create a .jpg filename
          finalReceiptPathForDB = path.join(parsedPath.dir, jpegOutputFilename); // Full path for the new JPEG

          console.log(`\x1b[32m[IMG]\x1b[0m Converting ${uploadedFilePath} to ${finalReceiptPathForDB}`);

          try {
            await sharp(uploadedFilePath) // Input is the file multer saved
              .jpeg()                   // Convert to JPEG
              .toFile(finalReceiptPathForDB);  // Output to the new .jpg path

            console.log(`\x1b[32m[IMG]\x1b[0m Image successfully converted to ${finalReceiptPathForDB}`);

            // Delete the original non-JPEG file after successful conversion,
            // but only if the output path is different (it should be if extension changed or was added)
            if (uploadedFilePath !== finalReceiptPathForDB) {
              try {
                await fs.unlink(uploadedFilePath);
                console.log(`\x1b[32m[IMG]\x1b[0m Original non-JPEG file ${uploadedFilePath} unlinked.`);
              } catch (unlinkErr) {
                console.warn(`\x1b[33m[WARN]\x1b[0m Could not unlink original non-JPEG file ${uploadedFilePath}: ${unlinkErr.message}`);
              }
            }
          } catch (err) {
            console.error('\x1b[31m[ERR]\x1b[0m Sharp conversion error:', err.message);
            results.push({ success: false, error: `Image conversion failed: ${err.message}` });
            finalReceiptPathForDB = null; // Don't use any path if conversion failed
          }
        } else {
          // It's already a JPEG, use the path where multer saved it
          console.log(`\x1b[32m[IMG]\x1b[0m File is already JPEG. Using as is: ${uploadedFilePath}`);
          finalReceiptPathForDB = uploadedFilePath;
        }

        // If we have a valid path (either original JPEG or converted JPEG), process it for OpenAI
        if (finalReceiptPathForDB && mimeType !== 'application/pdf') {
          try {
            base64ImageForHistoryAndProcessing = await fs.readFile(finalReceiptPathForDB, 'base64');
            const imageMessageContent = [
              { type: 'text', text: command ? `${command} - Image attached` : 'Process this image' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64ImageForHistoryAndProcessing}` } },
            ];
            const userImageMessage = { role: 'user', content: imageMessageContent };
            messagesToOpenAI.push(userImageMessage);

          } catch (readErr) {
            console.error('\x1b[31m[ERR]\x1b[0m Error reading processed image file for Base64 encoding:', readErr.message);
            results.push({ success: false, error: `Failed to read image file: ${readErr.message}` });
            finalReceiptPathForDB = null; // Can't use it if we can't read it
          }
        }
      }
    }

    // Log messages structure (careful with large base64)
    // console.log('Sending to OpenAI with messages (structure):', messagesToOpenAI.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.substring(0,100) : Array.isArray(m.content) ? 'Multipart content' : 'Unknown content' })));

    // Step 2: Call OpenAI for action decision
    console.log('Sending command to OpenAI for action decision...');
    const initResponse = await openai.chat.completions.create({
      model: 'gpt-4.1', // Using a newer model, e.g., gpt-4o or gpt-4-turbo
      messages: messagesToOpenAI,
      tools: toolsSchema,
      tool_choice: 'auto',
      max_tokens: 1500, // Increased slightly for complex decisions
    });

    const assistantResponse = initResponse.choices[0].message; // This is the direct response from the model
    console.log('1. OpenAI Action Response:', JSON.stringify(assistantResponse, null, 2));
    console.log('1.a OpenAI Action Response Object', assistantResponse);

    // Step 3: Parse AI decision
    if (assistantResponse.tool_calls && assistantResponse.tool_calls[0]) {
      const toolCall = assistantResponse.tool_calls[0];
      if (toolCall.function.name === 'handle_natural_command') {
        try {
          const parsedArgs = JSON.parse(toolCall.function.arguments);
          console.log('Parsed Args', parsedArgs);
          // aiDecision = UnifiedActionSchema.parse(parsedArgs);
          aiDecision = parsedArgs;
          console.log('AI Decision (Validated):', JSON.stringify(aiDecision, null, 2));
        } catch (parseError) {
          console.error('Failed to parse or validate AI tool arguments:', parseError);
          throw new Error(`AI response parsing/validation failed: ${parseError.message}`);
        }
      } else {
        console.warn(`Unexpected tool call: ${toolCall.function.name}`);
        aiDecision = UnifiedActionSchema.parse({ action: 'respond', message: "I received an unexpected tool call from the AI." });
      }
    } else if (assistantResponse.content) {
      console.log('AI responded directly (no tool call):', assistantResponse.content);
      aiDecision = UnifiedActionSchema.parse({ action: 'respond', message: assistantResponse.content });
    } else {
      console.error('No tool call or content in AI response for action decision.');
      throw new Error('AI did not provide a valid action or response for decision.');
    }


    // Step 4: Execute commands (potentially multiple steps)
    let currentResults = [];
    let continuationContext = null;
    let maxSteps = 3; // Prevent infinite loops
    let stepCount = 0;
    
    while (stepCount < maxSteps) {
      stepCount++;
      console.log(`Executing step ${stepCount} with action: ${aiDecision.action}`);
      
      // Store results from this step
      let stepResults = [];
      
      // Execute the appropriate function based on aiDecision
    // CREATE TRANSACTION ---------------------------------------------------------------------------------------------------------------------
    if (aiDecision.action === 'create_transaction') {
      console.log('Executing create_transaction');
      let receiptPath = null;
      if (req.file) {
        receiptPath = path.join('uploads', `${path.parse(req.file.filename).name}.jpg`);
      }

      const { shop, date, time, total, currency = 'CHF', discount = null, items, account_id = null } = aiDecision.transaction;
      
      // Validate transaction before creating
      if (!shop || shop === 'Unknown' || !total || total <= 0) {
        console.log(`⚠️ Rejecting invalid transaction: shop="${shop}", total=${total}`);
        stepResults.push({
          success: false,
          error: `Invalid transaction data: Missing shop name or invalid amount (shop: "${shop}", total: ${total}). Please provide a valid receipt with readable shop name and amount.`
        });
      } else {
          try {
            // Use the new synced function that handles both databases
            const syncResult = await createSyncedTransaction(shop, total, currency, date, receiptPath, items);
            
            if (syncResult.success) {
              stepResults.push({
                success: true,
                message: `✅ Added transaction for ${shop || 'unknown shop'} on ${date} in ${currency}${discount ? ` with ${discount} discount` : ''} for total of ${total} ${currency}. Synced to both databases (Original ID: ${syncResult.originalId}, Firefly ID: ${syncResult.fireflyId})`,
              });
            } else {
              stepResults.push({
                success: false,
                error: `Failed to create transaction: ${syncResult.error}`
              });
            }
          } catch (err) {
            console.error('Transaction creation error:', err.message);
            stepResults.push({
              success: false,
              error: `Failed to create transaction: ${err.message}`
            });
          }
        }
    } else if (aiDecision.action === 'add_income') {
      console.log('Executing add_income');
      const { type, amount, date, description, account_id } = aiDecision.income;
      try {
        // Use the new synced function that handles both databases
        const syncResult = await createSyncedIncome(type, amount, description || '', date);
        
        if (syncResult.success) {
          stepResults.push({
            success: true,
            message: `✅ Added ${type} income of ${amount} CHF on ${date}. Synced to both databases (Original ID: ${syncResult.originalId}, Firefly ID: ${syncResult.fireflyId})`
          });
        } else {
          stepResults.push({
            success: false,
            error: `Failed to create income: ${syncResult.error}`
          });
        }
      } catch (err) {
        console.error('Income creation error:', err.message);
        stepResults.push({
          success: false,
          error: `Failed to create income: ${err.message}`
        });
      }
    } else if (aiDecision.action === 'add_account') {
      console.log('Executing add_account');
      const { name, description, type, balance } = aiDecision.account;
      try {
        const accountResult = await dbRunAsync(
          'INSERT INTO accounts (name, description, type, balance) VALUES (?, ?, ?, ?)',
          [name, description, type, balance || 0.0]
        );
        const localAccountId = accountResult.lastID;
        stepResults.push({ success: true, message: `Added account ${name}` });

        try {
          const tfId = await createFireflyAccount(localAccountId);
          stepResults.push({ success: true, message: `Synced account to Firefly with ID ${tfId}` });
        } catch (err) {
          console.error('Firefly account sync error:', err.message);
          stepResults.push({ success: false, error: `Failed to sync account to Firefly: ${err.message}` });
        }
      } catch (err) {
        console.error('Database error:', err.message);
        throw err;
      }
      // CREATE EVENT ---------------------------------------------------------------------------------------------------------------------
    } else if (aiDecision.action === 'create_event') {
      console.log('Executing create_event');
      const auth = await authenticate(app);
      const validAuth = await ensureValidToken(auth, app);
      stepResults = await Promise.all(
        aiDecision.events.map(async event => {
          try {
            const result = await createEvent(validAuth, {
              summary: event.summary,
              description: event.description || '',
              startDateTime: event.startDateTime,
              endDateTime: event.endDateTime,
              location: event.location || '',
            });
            return { success: true, event: result };
          } catch (err) {
            return { success: false, error: err.message };
          }
        })
      );
      // CREATE TODO ---------------------------------------------------------------------------------------------------------------------
    } else if (aiDecision.action === 'create_todo') {
      console.log('Executing create_todo');
      stepResults = await Promise.all(
        aiDecision.todos.map(async todo => {
          try {
            const result = await addTodoToThings(todo);
            return { success: true, message: result.message };
          } catch (err) {
            return { success: false, error: err.message };
          }
        })
      );
      // CREATE COVER LETTER ---------------------------------------------------------------------------------------------------------------------
    } else if (aiDecision.action === 'create_cover_letter') {
      // Step 1: Read dossier content 
      let dossierContent;
      try { dossierContent = await fs.readFile(DOSSIER_PATH, 'utf8'); }
      catch (err) {
        throw new Error(`Failed to read dossier file: ${err.message}`);
      }

      // Step 2: Inject dossier content into prompt
      const promptWithDossier = coverLetterPrompt.replace('{{DOSSIER_CONTENT}}', dossierContent);

      // Determine source text: if src is a URL and exists in DB, fetch stored job description
      let srcInput = aiDecision.cover_letters[0].src.trim();
      if (/^https?:\/\//i.test(srcInput)) {
        try {
          const rows = await dbAllAsync(
            'SELECT description FROM jobs WHERE source_url = ?',
            [srcInput]
          );
          if (rows.length > 0 && rows[0].description) {
            srcInput = rows[0].description;
          } else {
            console.warn(`No job description found in DB for URL: ${srcInput}. Using URL as-is.`);
          }
        } catch (err) {
          console.warn(`Error fetching job description for URL ${srcInput}: ${err.message}`);
        }
      }

      console.log('Executing create_cover_letter');
      console.log('Using AI to structure the response');
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: promptWithDossier },
          { role: 'user', content: srcInput },
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'create_cover_letter', schema: CoverLetterJsonSchema, strict: true } },
        max_tokens: 1000,
      });

      const coverLetter = JSON.parse(response.choices[0].message.content);
      console.log('Structured Letter', coverLetter);
      stepResults = await Promise.all(
        coverLetter.cover_letters.map(async letter => {
          try {
            const result = await createCoverLetter(app, letter, {
            });
            return result;
          } catch (err) {
            return { success: false, error: err.message };
          }
        })
      );

    } else if (aiDecision.action === 'send_email') {
      console.log('Executing send_email');
      const authEmail = await authenticate(app);
      const validAuthEmail = await ensureValidToken(authEmail, app);
      stepResults = await Promise.all(
        aiDecision.emails.map(async email => {
          try {
            const sent = await sendEmail(validAuthEmail, email);
            return { success: true, message: `Email sent to ${email.to}`, message_id: sent.id };
          } catch (err) {
            return { success: false, error: err.message };
          }
        })
      );
    } else if (aiDecision.action === 'list_messages') {
      console.log('Executing list_messages');
      const authList = await authenticate(app);
      const validAuthList = await ensureValidToken(authList, app);
      try {
        const msgs = await listMessages(validAuthList, aiDecision.query, aiDecision.max_results);
        stepResults.push({ success: true, messages: msgs, total: msgs.length });
        
        // Store message context for potential follow-up
        if (msgs.length > 0) {
          continuationContext = { action: 'list_messages', messages: msgs };
        }
      } catch (err) {
        stepResults.push({ success: false, error: err.message });
      }
    } else if (aiDecision.action === 'get_message') {
      console.log('Executing get_message');
      const authGet = await authenticate(app);
      const validAuthGet = await ensureValidToken(authGet, app);
      try {
        const msg = await getMessage(validAuthGet, aiDecision.message_id);
        stepResults.push({ success: true, message: msg });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    } else if (aiDecision.action === 'modify_message') {
      console.log('Executing modify_message');
      const authMod = await authenticate(app);
      const validAuthMod = await ensureValidToken(authMod, app);
      try {
        const mod = await modifyMessage(validAuthMod, aiDecision.message_id, aiDecision.add_labels, aiDecision.remove_labels);
        stepResults.push({ success: true, result: mod });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    } else if (aiDecision.action === 'scrape_jobs') {
      console.log('Executing scrape_jobs');
      try {
        const { jobs, markdown } = await scrapeJobs(aiDecision.job_urls, {
          skip_network_check: aiDecision.skip_network_check,
          use_browser: aiDecision.use_browser,
          proxy_list_file: aiDecision.proxy_list_file,
          browser_ws: aiDecision.browser_ws,
          use_scrapingbee: aiDecision.use_scrapingbee,
          session_id: aiDecision.session_id,
          simulate_iphone: aiDecision.simulate_iphone,
          reuse_playwright_context_config: aiDecision.reuse_playwright_context_config,
        });
        // Persist unique jobs in database
        let newCount = 0;
        for (const job of jobs) {
          const existing = await dbAllAsync(
            'SELECT id FROM jobs WHERE source_url = ?',
            [job.url]
          );
          if (existing.length === 0) {
            await dbRunAsync(
              'INSERT INTO jobs (source_url, job_title, pensum, company, location, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [job.url, job.title, '', job.company, job.location, 'new', job.description || null]
            );
            newCount++;
          }
        }
        stepResults.push({ success: true, jobs, markdown, new_jobs: newCount });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    } else if (aiDecision.action === 'favorite_job') {
      console.log('Executing favorite_job');
      try {
        const { job_id, favorite } = aiDecision;
        const favoriteFlag = favorite !== false;
        const resultDb = await dbRunAsync(
          'UPDATE jobs SET favorite = ? WHERE id = ?',
          [favoriteFlag ? 1 : 0, job_id]
        );
        if (resultDb.changes === 0) {
          stepResults.push({ success: false, error: `No job found with id ${job_id}` });
        } else {
          stepResults.push({ success: true, message: `Job ${job_id} favorite set to ${favoriteFlag}` });
        }
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    } else if (aiDecision.action === 'execute_sql_query') {
      console.log('Executing execute_sql_query');
      const { query } = aiDecision;
      console.log(`SQL Query from AI: ${query}`);
      // Basic safety: prevent multiple statements, although AI should provide one
      if (query.split(';').filter(s => s.trim() !== '').length > 1) {
        throw new Error("Multiple SQL statements are not allowed in a single execute_sql_query action.");
      }
      // More robust validation might be needed depending on exposure
      const upperQuery = query.trim().toUpperCase();
      if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('INSERT') && !upperQuery.startsWith('UPDATE') && !upperQuery.startsWith('DELETE')) {
        // Stricter: only allow SELECT if DML is to be fully blocked here
        // throw new Error("Only SELECT queries are allowed via execute_sql_query for now. Use specific actions for modifications or propose migrations.");
        console.warn(`Executing potentially non-SELECT DML query: ${query}`);
      }

      try {
        let queryResultData;
        if (upperQuery.startsWith('SELECT')) {
          queryResultData = await dbAllAsync(query);
        } else { // INSERT, UPDATE, DELETE
          const runResult = await dbRunAsync(query);
          queryResultData = { changes: runResult.changes, lastID: runResult.lastID, message: "DML query executed successfully." };
        }
        stepResults.push({ success: true, data: queryResultData, query: query, message: `SQL query executed.` });
      } catch (err) {
        console.error(`SQL execution error: ${err.message} for query: ${query}`);
        stepResults.push({ success: false, error: `SQL error: ${err.message}`, query: query });
      }
      // PROCESS RECEIPT FILE ---------------------------------------------------------------------------------------------------------------------
    } else if (aiDecision.action === 'process_receipt_file') {
      console.log('Executing process_receipt_file');
      const { file_path, description } = aiDecision;
      
      try {
        // Check if file exists
        const fileExists = await fs.access(file_path).then(() => true).catch(() => false);
        if (!fileExists) {
          stepResults.push({
            success: false,
            error: `File not found: ${file_path}`
          });
        } else {
          console.log(`📄 Processing receipt file: ${file_path}`);
          
          // Create form data to send to our API
          const FormData = require('form-data');
          const formData = new FormData();
          const fileStream = require('fs').createReadStream(file_path);
          const fileName = path.basename(file_path);
          
          formData.append('file', fileStream, fileName);
          formData.append('command', description || 'Process this receipt');
          
          // Call our own API
          const axios = require('axios');
          const response = await axios.post(`http://localhost:${PORT}/api/process-receipt`, formData, {
            headers: formData.getHeaders(),
            timeout: 30000
          });
          
          if (response.data.success) {
            stepResults.push({
              success: true,
              message: response.data.message,
              transaction: response.data.transaction,
              confidence: response.data.confidence,
              source: 'manual_file_processing'
            });
          } else {
            stepResults.push({
              success: false,
              error: response.data.message || 'Processing failed',
              confidence: response.data.confidence,
              extracted_data: response.data.extracted_data
            });
          }
        }
      } catch (err) {
        console.error('Receipt file processing error:', err.message);
        stepResults.push({
          success: false,
          error: `Failed to process receipt file: ${err.message}`
        });
      }
      // GENERAL RESPONSE ---------------------------------------------------------------------------------------------------------------------
    } else if (aiDecision.action === 'respond') {
      console.log('Executing respond');
      const directResponse = aiDecision.message;
      stepResults = [{ success: true, message: directResponse }];
      console.log('Direct response:', directResponse);


      // For 'respond' action, update conversation history before returning
      const assistantFinalMessageForHistory = { role: 'assistant', content: directResponse };
      conversationHistory.push({
        user: userCommandMessage, // Store the main user text command
        assistant: assistantFinalMessageForHistory
      });
      while (conversationHistory.length > MAX_HISTORY_TURNS) {
        conversationHistory.shift(); // Remove the oldest turn
      }

      // For 'respond' action, skip the interpreter and use the message directly
      if (!isTelegramOrigin) {
        await logToAdminTelegram(`AI Response: \`${directResponse}\``, "HTTP API");
      }
      return res.json({ message: directResponse, details: [{ success: true, message: directResponse }] });

    } else {
      throw new Error('Unknown action');
    }
    
    // Add step results to current results
    currentResults.push(...stepResults);
    
    // Check if we need to continue with another step
    let needsContinuation = false;
    
    // Check for multi-step patterns
    if (aiDecision.action === 'list_messages' && continuationContext && stepResults.some(r => r.success)) {
      // Check if user command implies they want to see content
      const userWantsContent = /\b(show|read|content|details|latest|first)\b/i.test(command);
      if (userWantsContent && continuationContext.messages.length > 0) {
        // Auto-follow with get_message for the first/latest message
        const messageToGet = continuationContext.messages[0]; // First in list is usually latest
        aiDecision = {
          action: 'get_message',
          message_id: messageToGet.id
        };
        needsContinuation = true;
        console.log(`Auto-continuing with get_message for ID: ${messageToGet.id}`);
      }
    }
    
    if (!needsContinuation) {
      break; // Exit the while loop
    }
  }
  
  // Use currentResults as the final results
  results = currentResults;
    if (!isTelegramOrigin && command) { // Log only if not from Telegram itself
      await logToAdminTelegram(`User command: \`${command}\``, "HTTP API");
      if (req.file) {
        await logToAdminTelegram(`_Receipt image received._`, "HTTP API");
      }
    }

    console.log('Results before serialization:', JSON.stringify(results, null, 2));

    // Step 5: Sanitize results for JSON serialization
    const sanitizedResults = results.map(result => ({
      success: result.success,
      message: result.message || null,
      error: result.error || null,
      event: result.event || null,
      data: result.jobs
        ? { total: result.jobs.length, new_jobs: result.new_jobs || 0, markdown: result.markdown }
        : result.data || null,
      query: result.query || null,
      url: result.url || null,
      company: result.company || null,
      details: result.details || null,
      migration_description: result.migration_description || null,
      sql_statements: result.sql_statements || null,
      messages: result.messages || null,
      total: result.total || null,
      result: result.result || null,
      message_id: result.message_id || null,
    })).filter(r => r !== null); // Filter out any null results
    console.log('Sanitized results for interpreter:', JSON.stringify(sanitizedResults, null, 2)); if (sanitizedResults.length === 0 && !(aiDecision.action === 'respond' && assistantResponseForHistory.content)) {

      // If results is empty and it wasn't a direct respond action that already got handled.
      // Or if results are all errors from image processing etc.
      if (!results.some(r => r.success)) { // If no successful operations
        console.warn('No successful results generated from the command.');
        // Fallback to a generic error if no specific results were generated
        // This case might be hit if image processing fails and no other action is taken
        return res.status(500).json({ error: 'Failed to process command, no actionable results.' });
      }
    }

    // Step 6: Interpret the result for a user-friendly summary
    console.log('Interpreting results for user summary...');
    const interpretResponse = await openai.chat.completions.create({
      model: 'gpt-4.1', // Or gpt-4-turbo
      messages: [
        { role: 'system', content: interpreterPrompt },
        { role: 'user', content: JSON.stringify(sanitizedResults) }, // Send all results for summary
      ],
      max_tokens: 400, // Summary should be concise
    });

    const summary = interpretResponse.choices[0].message.content.trim();
    console.log('Interpreter summary:', summary);

    if (!isTelegramOrigin && summary) { // Log only if not from Telegram itself
      await logToAdminTelegram(`AI Response: \`${summary}\``, "HTTP API");
    }

    // Step 7: Update conversation history with the user's primary command and the final summary
    const assistantFinalMessageForHistory = { role: 'assistant', content: summary };
    conversationHistory.push({
      user: userCommandMessage, // Store the main user text command
      assistant: assistantFinalMessageForHistory
    });
    while (conversationHistory.length > MAX_HISTORY_TURNS) {
      conversationHistory.shift(); // Remove the oldest turn
    }

    // Step 8: Return the summary
    const overallSuccess = sanitizedResults.length > 0 && sanitizedResults.every(r => r.success);
    // If there are any results, and at least one is successful, or if it was a respond action that by default is successful.
    if ((sanitizedResults.length > 0 && sanitizedResults.some(r => r.success)) || (aiDecision.action === 'respond' && sanitizedResults.length > 0 && sanitizedResults[0].success)) {
      res.json({ message: summary, details: sanitizedResults });
    } else {
      const errorMessages = sanitizedResults.filter(r => !r.success && r.error).map(r => r.error).join('; ') || 'An unknown error occurred during processing.';
      // Use summary if available and meaningful for errors, otherwise fallback
      const responseError = summary && !overallSuccess ? summary : `Failed to process command: ${errorMessages}`;
      res.status(500).json({ error: responseError, details: sanitizedResults });
    }

  } catch (err) {
    console.error('Error in /ai/natural endpoint:', err.stack);
    // Log the command that caused the error for easier debugging
    console.error(`Failed command: ${command}`);
    if (aiDecision) { // If aiDecision was parsed, log it
      console.error(`AI Decision at time of error: ${JSON.stringify(aiDecision)}`);
    }

    if (!isTelegramOrigin) { // Log error to Telegram if not from Telegram
      await logToAdminTelegram(`Error processing command: \`${command || 'N/A'}\`\nError: \`${err.message}\``, "HTTP API Error");
    }

    // Attempt to add to history even on failure, if possible, to record the attempt
    // This part of history update might be simplified or removed if too complex in error state
    if (currentTurnUserMessages.length > 0 && !conversationHistory.find(turn => turn.user === currentTurnUserMessages[0])) {
      conversationHistory.push({
        user: currentTurnUserMessages[0], // The main text command
        assistant: { role: 'assistant', content: `I encountered an error trying to process that: ${err.message}` }
      });
      while (conversationHistory.length > MAX_HISTORY_TURNS) {
        conversationHistory.shift();
      }
    }
    res.status(500).json({ error: `Server error while processing command: ${err.message}` });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Express error:', err.stack);
  // Append to unified log file
  const errorLogPath = path.join(process.cwd(), 'error.log');
  fs.appendFile(errorLogPath, `${new Date().toISOString()} - Unhandled Express Error: ${err.stack}\n`).catch(e => console.error("Failed to write to log file", e));
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Ensure 'uploads' directory exists
// Ensure 'uploads' directory exists
fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true }).catch(console.error);

// Only start server when run directly (not when imported for tests)
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${TAILSCALE_IP}:${PORT} (bound to ${HOST}:${PORT})`);
    console.log(`Open http://localhost:${PORT} or http://127.0.0.1:${PORT} in your browser if running locally.`);
    // console.dir(tools, { depth: null, colors: true });
    
    // Start email monitoring
    startEmailMonitoring();
  });
}

module.exports = app;
