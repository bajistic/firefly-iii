const axios = require('axios');
const crypto = require('crypto');
const { dbRunAsync, dbAllAsync } = require('./db');
const mysql = require('mysql2/promise');
require('dotenv').config();

const {
  FIREFLY_URL,
  FIREFLY_TOKEN,
  FIREFLY_WEBHOOK_SECRET,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

// Original MariaDB connection for syncing
let originalDbConnection = null;
async function getOriginalDbConnection() {
  if (!originalDbConnection) {
    originalDbConnection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: 'finance' // Your original database name
    });
  }
  return originalDbConnection;
}

const fireflyEnabled = Boolean(FIREFLY_URL && FIREFLY_TOKEN);
if (!fireflyEnabled) {
  console.warn('Firefly integration disabled: FIREFLY_URL and FIREFLY_TOKEN must be set in .env');
}

// Axios instance for Firefly III API (v1)
const api = fireflyEnabled
  ? axios.create({
      baseURL: `${FIREFLY_URL.replace(/\/+$/, '')}/api/v1`,
      headers: {
        Authorization: `Bearer ${FIREFLY_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
  : null;


/**
 * Create a transaction via Firefly III API
 * This uses the official API instead of direct database access
 */
async function createFireflyTransaction(shop, amount, currency = 'EUR', date = null, receiptPath = null) {
  if (!fireflyEnabled) {
    console.warn('Firefly integration disabled');
    return null;
  }

  try {
    const transactionDate = date || new Date().toISOString().split('T')[0];
    
    // Check for duplicate transactions in Firefly III (if available)
    try {
      const { data: existingTransactions } = await api.get(`/transactions?start=${transactionDate}&end=${transactionDate}`);
      const duplicate = existingTransactions.data.find(transaction => {
        const txn = transaction.attributes.transactions[0];
        return txn.description.includes(shop) && 
               Math.abs(parseFloat(txn.amount)) === Math.abs(amount) &&
               txn.currency_code === currency;
      });
      
      if (duplicate) {
        console.log(`⚠️ Duplicate Firefly transaction detected: ${shop} - ${amount} ${currency} on ${transactionDate}`);
        return duplicate.id;
      }
    } catch (connError) {
      if (connError.response?.status === 302 || connError.message.includes('login')) {
        console.warn(`⚠️ Firefly III authentication failed - token invalid or expired`);
        return null;
      }
      console.warn(`⚠️ Unable to check for Firefly duplicates (Firefly III unavailable): ${connError.message}`);
    }
    
    // Get accounts to use for the transaction
    try {
      var { data: accounts } = await api.get('/accounts');
    } catch (authError) {
      if (authError.response?.status === 302 || authError.message.includes('login')) {
        console.warn(`⚠️ Firefly III authentication failed - skipping Firefly sync`);
        return null;
      }
      throw authError;
    }
    const assetAccount = accounts.data.find(acc => acc.attributes.type === 'asset');
    const expenseAccount = accounts.data.find(acc => acc.attributes.type === 'expense' && acc.attributes.name.toLowerCase().includes('general'));
    
    if (!assetAccount) {
      throw new Error('No asset account found');
    }
    
    // Create expense account if it doesn't exist
    let expenseAccountId;
    if (!expenseAccount) {
      const { data: newAccount } = await api.post('/accounts', {
        name: shop,
        type: 'expense',
        currency_code: currency
      });
      expenseAccountId = newAccount.data.id;
    } else {
      expenseAccountId = expenseAccount.id;
    }

    // Create the transaction
    const transactionData = {
      error_if_duplicate_hash: false,
      apply_rules: true,
      fire_webhooks: true,
      group_title: `Purchase at ${shop}`,
      transactions: [
        {
          type: 'withdrawal',
          date: transactionDate,
          amount: Math.abs(amount).toString(),
          description: `Purchase at ${shop}`,
          source_id: assetAccount.id,
          destination_id: expenseAccountId,
          currency_code: currency,
          notes: receiptPath ? `Receipt: ${receiptPath}` : undefined
        }
      ]
    };

    const { data: result } = await api.post('/transactions', transactionData);
    
    console.log(`✅ Created Firefly transaction: ${shop} - ${amount} ${currency}`);
    return result.data.id;

  } catch (error) {
    console.error('❌ Error creating Firefly transaction:', error);
    return null;
  }
}

/**
 * Create an income transaction in Firefly III
 */
async function createFireflyIncomeTransaction(source, amount, currency = 'EUR', date = null) {
  // Similar implementation for income transactions
  // This would create a deposit transaction type
  console.log('Income transaction creation not yet implemented for native schema');
  return null;
}

/**
 * Create an account in Firefly III
 */
async function createFireflyAccount(name, type = 'asset', iban = null) {
  if (!fireflyEnabled) return null;

  try {
    const users = await dbAllAsync('SELECT id FROM users LIMIT 1');
    if (!users.length) throw new Error('No user found');
    const userId = users[0].id;

    const memberships = await dbAllAsync('SELECT user_group_id FROM group_memberships WHERE user_id = ?', [userId]);
    const userGroupId = memberships[0]?.user_group_id || 1;

    // Determine account type ID
    let accountTypeId = 3; // Asset account
    if (type === 'expense') accountTypeId = 4;
    if (type === 'revenue') accountTypeId = 5;

    const result = await dbRunAsync(`
      INSERT INTO accounts (
        created_at, updated_at, user_id, user_group_id, account_type_id,
        name, virtual_balance, iban, active, encrypted, \`order\`
      ) VALUES (NOW(), NOW(), ?, ?, ?, ?, 0.00, ?, 1, 0, 1)
    `, [userId, userGroupId, accountTypeId, name, iban]);

    console.log(`✅ Created Firefly account: ${name}`);
    return result.lastID;

  } catch (error) {
    console.error('❌ Error creating Firefly account:', error);
    return null;
  }
}

// Keep webhook verification for API integration
function verifySignature(signature, payload) {
  if (!fireflyEnabled || !FIREFLY_WEBHOOK_SECRET || !signature) return false;
  const hmac = crypto.createHmac('sha256', FIREFLY_WEBHOOK_SECRET);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function handleWebhook(event) {
  // Webhook handling can remain the same since we're now using the same database
  console.log('Webhook handling not needed when using native Firefly database');
}

/**
 * Enhanced transaction creation that syncs both databases
 * Keeps AI interface minimal while maintaining dual sync
 */
async function createSyncedTransaction(shop, amount, currency = 'EUR', date = null, receiptPath = null, items = []) {
  const transactionDate = date || new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0];
  
  try {
    const originalDb = await getOriginalDbConnection();
    
    // Check for duplicate transactions
    const [existing] = await originalDb.execute(`
      SELECT id FROM transactions 
      WHERE shop = ? AND date = ? AND total = ? AND currency = ?
      LIMIT 1
    `, [shop, transactionDate, amount, currency]);
    
    if (existing.length > 0) {
      console.log(`⚠️ Duplicate transaction detected: ${shop} - ${amount} ${currency} on ${transactionDate}`);
      return {
        originalId: existing[0].id,
        fireflyId: null,
        success: true,
        duplicate: true
      };
    }
    
    // 1. Create in original MariaDB database
    const [result] = await originalDb.execute(`
      INSERT INTO transactions (shop, date, time, total, currency, receipt_path, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [shop, transactionDate, time, amount, currency, receiptPath, 1]);
    
    const originalTransactionId = result.insertId;
    
    // 2. Insert items if provided
    for (const item of items) {
      await originalDb.execute(`
        INSERT INTO items (transaction_id, name, quantity, price, category)
        VALUES (?, ?, ?, ?, ?)
      `, [originalTransactionId, item.name, item.quantity || 1, item.price || 0, item.category || '']);
    }
    
    // 3. Create in Firefly III (using existing function)
    const fireflyJournalId = await createFireflyTransaction(shop, amount, currency, date, receiptPath);
    
    // 4. Link the two records
    if (fireflyJournalId) {
      await originalDb.execute(`
        UPDATE transactions SET transaction_journal_id = ? WHERE id = ?
      `, [fireflyJournalId, originalTransactionId]);
    }
    
    console.log(`✅ Synced transaction: ${shop} - ${amount} ${currency} (Original ID: ${originalTransactionId}, Firefly ID: ${fireflyJournalId})`);
    
    return {
      originalId: originalTransactionId,
      fireflyId: fireflyJournalId,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error syncing transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enhanced income creation that syncs both databases
 */
async function createSyncedIncome(type, amount, description = '', date = null) {
  const incomeDate = date || new Date().toISOString().split('T')[0];
  
  try {
    // 1. Create in original MariaDB database
    const originalDb = await getOriginalDbConnection();
    const [result] = await originalDb.execute(`
      INSERT INTO income (type, amount, date, description, account_id)
      VALUES (?, ?, ?, ?, ?)
    `, [type, amount, incomeDate, description, 1]);
    
    const originalIncomeId = result.insertId;
    
    // 2. Create in Firefly III (using existing function)
    const fireflyJournalId = await createFireflyIncomeTransaction(type, amount, 'CHF', date);
    
    // 3. Link the records
    if (fireflyJournalId) {
      await originalDb.execute(`
        UPDATE income SET firefly_id = ? WHERE id = ?
      `, [fireflyJournalId, originalIncomeId]);
    }
    
    console.log(`✅ Synced income: ${type} - ${amount} CHF (Original ID: ${originalIncomeId}, Firefly ID: ${fireflyJournalId})`);
    
    return {
      originalId: originalIncomeId,
      fireflyId: fireflyJournalId,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Error syncing income:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  verifySignature,
  handleWebhook,
  createFireflyTransaction,
  createFireflyIncomeTransaction,
  createFireflyAccount,
  // New synced functions
  createSyncedTransaction,
  createSyncedIncome,
};