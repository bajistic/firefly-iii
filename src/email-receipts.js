const { authenticate, ensureValidToken } = require('./auth');
const { listMessages, getMessage, modifyMessage } = require('./gmail');
const { createSyncedTransaction } = require('./firefly');
const { originalLog } = require('./console');
const fs = require('fs').promises;
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

let botInstance;
if (TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID) {
  botInstance = new TelegramBot(TELEGRAM_BOT_TOKEN);
}

/**
 * Known receipt/invoice senders - add your common vendors here
 */
const KNOWN_RECEIPT_SENDERS = [
  // Shopping
  'noreply@amazon.com',
  'auto-confirm@amazon.com',
  'ship-confirm@amazon.com',
  
  // Food delivery
  'receipts@uber.com',
  'noreply@ubereats.com',
  'no-reply@doordash.com',
  'receipts@grubhub.com',
  
  // Swiss retailers
  'noreply@migros.ch',
  'service@coop.ch',
  'noreply@manor.ch',
  'info@galaxus.ch',
  
  // Payment services
  'service@paypal.com',
  'noreply@paypal.com',
  'receipts@square.com',
  'noreply@stripe.com',
  
  // Utilities & Services
  'noreply@swisscom.com',
  'service@sunrise.ch',
  'billing@anthropic.com',
  'receipts@netflix.com',
  'noreply@spotify.com',
  
  // Travel
  'no-reply@booking.com',
  'noreply@airbnb.com',
  'confirmations@hotels.com'
];

/**
 * Subject line patterns that typically indicate receipts/invoices
 */
const RECEIPT_SUBJECT_PATTERNS = [
  // English
  /receipt|invoice|bill|payment|order.*confirmation/i,
  /your.*order|purchase.*complete|transaction.*complete/i,
  /payment.*successful|payment.*received/i,
  
  // German (for Swiss context)
  /rechnung|beleg|quittung|zahlung/i,
  /bestellung|kaufbestätigung/i,
  
  // Common formats
  /order\s*#|invoice\s*#|receipt\s*#/i
];

/**
 * Check if an email is likely a receipt based on sender and subject
 */
function isLikelyReceipt(email) {
  const headers = email.payload.headers;
  const fromHeader = headers.find(h => h.name === 'From');
  const subjectHeader = headers.find(h => h.name === 'Subject');
  
  if (!fromHeader || !subjectHeader) return false;
  
  const from = fromHeader.value.toLowerCase();
  const subject = subjectHeader.value;
  
  // Check if sender is in known list
  const isKnownSender = KNOWN_RECEIPT_SENDERS.some(sender => 
    from.includes(sender.toLowerCase())
  );
  
  // Check if subject matches receipt patterns
  const hasReceiptSubject = RECEIPT_SUBJECT_PATTERNS.some(pattern => 
    pattern.test(subject)
  );
  
  // Must have at least one indicator
  return isKnownSender || hasReceiptSubject;
}

/**
 * Extract basic info from email headers
 */
function extractEmailInfo(email) {
  const headers = email.payload.headers;
  const fromHeader = headers.find(h => h.name === 'From');
  const subjectHeader = headers.find(h => h.name === 'Subject');
  const dateHeader = headers.find(h => h.name === 'Date');
  
  return {
    from: fromHeader?.value || 'Unknown',
    subject: subjectHeader?.value || 'No Subject',
    date: dateHeader?.value || '',
    messageId: email.id,
    snippet: email.snippet || ''
  };
}

/**
 * Download email attachment to uploads folder
 */
async function downloadAttachment(auth, messageId, attachmentId, filename) {
  try {
    const gmail = require('googleapis').google.gmail({ version: 'v1', auth });
    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId
    });
    
    const data = Buffer.from(attachment.data.data, 'base64');
    const timestamp = Date.now();
    const safeFilename = `${timestamp}-email-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join('uploads', safeFilename);
    
    await fs.writeFile(filePath, data);
    console.log(`📎 Downloaded attachment: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('❌ Error downloading attachment:', error);
    return null;
  }
}

/**
 * Process attachments from an email
 */
async function processEmailAttachments(auth, email) {
  const attachments = [];
  
  // Recursive function to find attachments in email parts
  function findAttachments(parts) {
    if (!parts) return;
    
    for (const part of parts) {
      if (part.filename && part.body?.attachmentId) {
        // Check if it's a PDF or image
        const mimeType = part.mimeType;
        if (mimeType === 'application/pdf' || mimeType?.startsWith('image/')) {
          attachments.push({
            filename: part.filename,
            mimeType: mimeType,
            attachmentId: part.body.attachmentId,
            size: part.body.size
          });
        }
      }
      
      // Recursively check nested parts
      if (part.parts) {
        findAttachments(part.parts);
      }
    }
  }
  
  findAttachments([email.payload]);
  
  // Download relevant attachments
  const downloadedFiles = [];
  for (const attachment of attachments) {
    console.log(`📎 Found attachment: ${attachment.filename} (${attachment.mimeType})`);
    const filePath = await downloadAttachment(auth, email.id, attachment.attachmentId, attachment.filename);
    if (filePath) {
      downloadedFiles.push({
        path: filePath,
        mimeType: attachment.mimeType,
        originalName: attachment.filename
      });
    }
  }
  
  return downloadedFiles;
}

/**
 * Classify email content using AI to determine if it's a receipt and extract confidence
 */
async function classifyReceiptEmail(emailInfo, emailBodyText = '') {
  try {
    const prompt = `
Analyze this email and determine:

1. Is this a purchase receipt or invoice? (not subscription renewals, shipping notifications, or marketing)
2. Confidence level (0-100%)
3. Transaction type (purchase, refund, subscription, shipping, marketing, other)
4. Priority (high=immediate purchase receipt, medium=service invoice, low=subscription/notification)

Email Details:
- From: ${emailInfo.from}
- Subject: ${emailInfo.subject}
- Preview: ${emailInfo.snippet}
- Body: ${emailBodyText.substring(0, 500)}

Respond in JSON format:
{
  "isReceipt": boolean,
  "confidence": number (0-100),
  "type": "purchase|refund|subscription|shipping|marketing|other",
  "priority": "high|medium|low",
  "reasoning": "brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`🤖 AI Classification: ${result.confidence}% confidence - ${result.type} (${result.priority} priority)`);
    console.log(`🧠 Reasoning: ${result.reasoning}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error in AI classification:', error);
    return {
      isReceipt: false,
      confidence: 0,
      type: 'other',
      priority: 'low',
      reasoning: 'Classification failed'
    };
  }
}

/**
 * Extract transaction data from PDF receipt using AI
 */
async function extractTransactionFromPDF(pdfPath, emailInfo) {
  try {
    console.log(`🔍 Extracting transaction data from PDF: ${path.basename(pdfPath)}`);
    
    // Extract text from PDF
    const pdf = require('pdf-parse');
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdf(pdfBuffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      console.log('❌ No text found in PDF');
      return null;
    }
    
    console.log(`📄 Extracted ${pdfData.text.length} characters from PDF`);
    
    // Use AI to extract structured transaction data
    const prompt = `
Extract transaction details from this receipt PDF text. The email was from "${emailInfo.from}" with subject "${emailInfo.subject}".

PDF Text:
${pdfData.text}

Extract and return JSON with:
{
  "shop": "store/company name",
  "date": "YYYY-MM-DD",
  "total": number,
  "currency": "USD|EUR|CHF|etc",
  "receipt_number": "receipt/invoice number (if found, null if not)",
  "items": [
    {
      "name": "item name",
      "quantity": number,
      "price": number,
      "category": "groceries|electronics|clothing|services|etc"
    }
  ],
  "confidence": number (0-100),
  "extracted_data": {
    "transaction_id": "if available",
    "payment_method": "if available",
    "tax": number (if available)
  }
}

Rules:
- Use actual shop name from receipt, not email sender
- Date should be transaction date, not email date
- Total should be final amount paid
- Receipt number: Look for invoice numbers, receipt numbers, order numbers, transaction IDs (e.g., "Invoice #12345", "Receipt: ABC123", "Order #99999")
- Items should be individual products/services
- Categories: groceries, dining, transportation, electronics, clothing, entertainment, health, services, utilities, other
- If unclear, use reasonable defaults and lower confidence
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.1
    });

    const transaction = JSON.parse(response.choices[0].message.content);
    
    console.log(`✅ AI extracted transaction: ${transaction.shop} - ${transaction.total} ${transaction.currency} (${transaction.confidence}% confidence)`);
    console.log(`📦 Items: ${transaction.items.length} items extracted`);
    
    return transaction;
    
  } catch (error) {
    console.error('❌ Error extracting transaction from PDF:', error);
    return null;
  }
}

/**
 * Create transaction from extracted data
 */
async function createTransactionFromEmail(transactionData, receiptPath, emailInfo) {
  try {
    if (!transactionData || !transactionData.shop || !transactionData.total) {
      console.log('❌ Invalid transaction data, skipping creation');
      return { success: false, error: 'Invalid transaction data' };
    }
    
    // Validate data quality
    if (transactionData.confidence < 60) {
      console.log(`⚠️ Low confidence (${transactionData.confidence}%), requiring manual review`);
      return { 
        success: false, 
        error: `Low confidence (${transactionData.confidence}%)`,
        requiresReview: true,
        data: transactionData
      };
    }
    
    console.log(`🔄 Creating transaction: ${transactionData.shop} - ${transactionData.total} ${transactionData.currency}`);
    if (transactionData.receipt_number) {
      console.log(`📄 Receipt number: ${transactionData.receipt_number}`);
    }
    
    // Create transaction using existing system
    const result = await createSyncedTransaction(
      transactionData.shop,
      transactionData.total,
      transactionData.currency || 'CHF',
      transactionData.date,
      receiptPath,
      transactionData.items || [],
      transactionData.receipt_number
    );
    
    if (result.success) {
      console.log(`✅ Successfully created transaction ID: ${result.originalId}`);
      return {
        success: true,
        transactionId: result.originalId,
        shop: transactionData.shop,
        total: transactionData.total,
        currency: transactionData.currency,
        items: transactionData.items || []
      };
    } else {
      console.log(`❌ Failed to create transaction: ${result.error}`);
      
      // Handle duplicate detection specifically
      if (result.isDuplicate) {
        console.log(`🔄 Duplicate detected - skipping creation`);
        return { 
          success: false, 
          error: result.error,
          isDuplicate: true,
          existingTransaction: result.existingTransaction
        };
      }
      
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error('❌ Error creating transaction from email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send enhanced Telegram notification with transaction results
 */
async function notifyReceiptProcessed(emailInfo, attachments, classification, transactionResult = null) {
  if (!botInstance || !TELEGRAM_ADMIN_CHAT_ID) return;
  
  try {
    const confidenceEmoji = classification.confidence >= 80 ? '🎯' : classification.confidence >= 60 ? '🔶' : '⚠️';
    const statusEmoji = transactionResult?.success ? '✅' : transactionResult?.requiresReview ? '👀' : '❌';
    
    let message = `
📧 *Receipt Email Processed* ${statusEmoji}

👤 **From:** ${emailInfo.from}
📋 **Subject:** ${emailInfo.subject}
📅 **Date:** ${new Date(emailInfo.date).toLocaleDateString()}

🤖 **AI Classification:** ${confidenceEmoji}
• Type: ${classification.type}
• Confidence: ${classification.confidence}%
• Priority: ${classification.priority}
• Reasoning: ${classification.reasoning}
    `.trim();

    if (attachments.length > 0) {
      message += `\n\n📎 **Attachments:** ${attachments.length} file(s)`;
    }

    if (transactionResult) {
      if (transactionResult.success) {
        message += `\n\n💰 **Transaction Created:**`;
        message += `\n🏪 Shop: ${transactionResult.shop}`;
        message += `\n💵 Amount: ${transactionResult.total} ${transactionResult.currency}`;
        message += `\n📦 Items: ${transactionResult.items.length} items`;
        message += `\n🆔 ID: ${transactionResult.transactionId}`;
      } else if (transactionResult.requiresReview) {
        message += `\n\n👀 **Requires Manual Review:**`;
        message += `\n⚠️ ${transactionResult.error}`;
        if (transactionResult.data) {
          message += `\n🏪 Detected: ${transactionResult.data.shop}`;
          message += `\n💵 Amount: ${transactionResult.data.total} ${transactionResult.data.currency}`;
        }
      } else {
        message += `\n\n❌ **Processing Failed:**`;
        message += `\n🚫 ${transactionResult.error}`;
      }
    }
    
    await botInstance.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Error sending enhanced Telegram notification:', error);
  }
}

/**
 * Send Telegram notification about detected receipt
 */
async function notifyReceiptDetected(emailInfo, attachments, processing = false) {
  if (!botInstance || !TELEGRAM_ADMIN_CHAT_ID) return;
  
  try {
    const status = processing ? "🔄 *Processing*" : "👀 *Detected*";
    const attachmentInfo = attachments.length > 0 
      ? `\n📎 ${attachments.length} attachment(s): ${attachments.map(a => a.originalName).join(', ')}`
      : '\n📎 No attachments';
    
    const message = `
📧 *Receipt Email ${status}*

👤 **From:** ${emailInfo.from}
📋 **Subject:** ${emailInfo.subject}
📅 **Date:** ${new Date(emailInfo.date).toLocaleDateString()}
${attachmentInfo}

📝 **Preview:** ${emailInfo.snippet.substring(0, 150)}${emailInfo.snippet.length > 150 ? '...' : ''}
    `.trim();
    
    await botInstance.sendMessage(TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('❌ Error sending Telegram notification:', error);
  }
}

/**
 * Check for new receipt emails and process them
 */
async function checkForReceiptEmails() {
  try {
    console.log('📧 Checking for new receipt emails...');
    
    // Get authenticated client
    const app = require('express')(); // Minimal express instance for auth
    const auth = await authenticate(app);
    const validAuth = await ensureValidToken(auth, app);
    
    // Search for unread emails from known senders or with receipt keywords
    // Look for emails from last 2 hours to avoid reprocessing same emails repeatedly
    const query = `is:unread newer_than:2h (${KNOWN_RECEIPT_SENDERS.map(s => `from:${s}`).join(' OR ')}) OR (is:unread newer_than:2h (receipt OR invoice OR bill OR "order confirmation"))`;
    
    console.log(`🔍 Gmail query: ${query}`);
    
    const messages = await listMessages(validAuth, query, 20);
    
    if (!messages || messages.length === 0) {
      console.log('📭 No new receipt emails found');
      return;
    }
    
    console.log(`📬 Found ${messages.length} potential receipt email(s)`);
    
    let processedCount = 0;
    
    for (const messageRef of messages) {
      try {
        // Get full email content
        const email = await getMessage(validAuth, messageRef.id);
        const emailInfo = extractEmailInfo(email);
        
        console.log(`\n📧 Checking email from: ${emailInfo.from}`);
        console.log(`📋 Subject: ${emailInfo.subject}`);
        
        // Check if this looks like a receipt
        if (isLikelyReceipt(email)) {
          console.log('✅ Email identified as potential receipt');
          
          // AI Classification
          console.log('🤖 Running AI classification...');
          const classification = await classifyReceiptEmail(emailInfo);
          
          // Process attachments
          const attachments = await processEmailAttachments(validAuth, email);
          
          let transactionResult = null;
          
          // If AI is confident this is a receipt and we have attachments, process automatically
          if (classification.isReceipt && classification.confidence >= 70 && attachments.length > 0) {
            console.log(`🚀 High confidence receipt (${classification.confidence}%) - processing automatically`);
            
            // Process PDF attachments
            for (const attachment of attachments) {
              if (attachment.mimeType === 'application/pdf') {
                console.log(`📄 Processing PDF: ${attachment.originalName}`);
                
                const transactionData = await extractTransactionFromPDF(attachment.path, emailInfo);
                if (transactionData) {
                  transactionResult = await createTransactionFromEmail(transactionData, attachment.path, emailInfo);
                  if (transactionResult.success) {
                    console.log(`✅ Successfully created transaction from ${attachment.originalName}`);
                    break; // Stop after first successful transaction
                  }
                }
              }
            }
          } else if (classification.isReceipt && classification.confidence < 70) {
            console.log(`⚠️ Medium confidence receipt (${classification.confidence}%) - flagged for review`);
            transactionResult = {
              success: false,
              requiresReview: true,
              error: `Medium confidence (${classification.confidence}%) - manual review required`
            };
          } else {
            console.log(`❌ Not classified as receipt (${classification.confidence}% confidence) - skipping auto-processing`);
          }
          
          // Send enhanced notification with results
          await notifyReceiptProcessed(emailInfo, attachments, classification, transactionResult);
          
          // Skip marking as read due to permissions (emails will be reprocessed but that's fine)
          processedCount++;
          
          console.log(`✅ Processed email successfully (ID: ${email.id})`);
          
          // Add some delay between processing to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } else {
          console.log('❌ Email does not appear to be a receipt');
        }
        
      } catch (error) {
        console.error(`❌ Error processing email ${messageRef.id}:`, error);
      }
    }
    
    if (processedCount > 0) {
      console.log(`\n✅ Processed ${processedCount} receipt email(s)`);
    }
    
  } catch (error) {
    console.error('❌ Error in checkForReceiptEmails:', error);
  }
}

/**
 * Start email monitoring (call this from server.js)
 */
function startEmailMonitoring() {
  console.log('📧 Starting email receipt monitoring...');
  
  // Check immediately
  checkForReceiptEmails();
  
  // Then check every 15 minutes
  setInterval(checkForReceiptEmails, 15 * 60 * 1000);
  
  console.log('⏰ Email monitoring scheduled every 15 minutes');
}

/**
 * Search Gmail for receipts with specific query and optionally download attachments
 */
async function searchGmailForReceipts(query, maxResults = 20, downloadAttachments = false) {
  try {
    console.log(`🔍 Searching Gmail with query: ${query}`);
    
    // Get authenticated client
    const app = require('express')(); // Minimal express instance for auth
    const auth = await authenticate(app);
    const validAuth = await ensureValidToken(auth, app);
    
    // Search for emails
    const messages = await listMessages(validAuth, query, maxResults);
    
    if (!messages || messages.length === 0) {
      console.log('📭 No emails found matching query');
      return { emails: [], attachments: [] };
    }
    
    console.log(`📬 Found ${messages.length} email(s) matching query`);
    
    const results = {
      emails: [],
      attachments: []
    };
    
    for (const messageRef of messages) {
      try {
        // Get full email content
        const email = await getMessage(validAuth, messageRef.id);
        const emailInfo = extractEmailInfo(email);
        
        results.emails.push({
          id: email.id,
          from: emailInfo.from,
          subject: emailInfo.subject,
          date: emailInfo.date,
          snippet: emailInfo.snippet
        });
        
        // Download attachments if requested
        if (downloadAttachments) {
          console.log(`📎 Checking attachments for email: ${emailInfo.subject}`);
          const attachments = await processEmailAttachments(validAuth, email);
          
          for (const attachment of attachments) {
            results.attachments.push({
              path: attachment.path,
              mimeType: attachment.mimeType,
              originalName: attachment.originalName,
              emailId: email.id,
              emailSubject: emailInfo.subject
            });
          }
        }
        
        // Add delay between emails to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing email ${messageRef.id}:`, error);
      }
    }
    
    console.log(`✅ Processed ${results.emails.length} emails with ${results.attachments.length} attachments`);
    return results;
    
  } catch (error) {
    console.error('❌ Error searching Gmail for receipts:', error);
    throw new Error(`Gmail search failed: ${error.message}`);
  }
}

module.exports = {
  checkForReceiptEmails,
  startEmailMonitoring,
  searchGmailForReceipts,
  isLikelyReceipt,
  classifyReceiptEmail,
  extractTransactionFromPDF,
  createTransactionFromEmail,
  KNOWN_RECEIPT_SENDERS,
  RECEIPT_SUBJECT_PATTERNS
};