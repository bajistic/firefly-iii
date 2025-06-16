const axios = require('axios');
const crypto = require('crypto');
const { dbRunAsync, dbAllAsync } = require('./db');
require('dotenv').config();

const {
  FIREFLY_URL,
  FIREFLY_TOKEN,
  FIREFLY_WEBHOOK_SECRET,
} = process.env;

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
 * Create a transaction directly in Firefly III database
 * This function now works with the native Firefly III schema
 */
async function createFireflyTransaction(shop, amount, currency = 'EUR', date = null, receiptPath = null) {
  if (!fireflyEnabled) {
    console.warn('Firefly integration disabled');
    return null;
  }

  try {
    // Get user ID (assuming first user)
    const users = await dbAllAsync('SELECT id FROM users LIMIT 1');
    if (!users.length) throw new Error('No user found in Firefly III database');
    const userId = users[0].id;

    // Get user group ID
    const memberships = await dbAllAsync('SELECT user_group_id FROM group_memberships WHERE user_id = ?', [userId]);
    if (!memberships.length) throw new Error('User has no group membership');
    const userGroupId = memberships[0].user_group_id;

    // Get default accounts
    const assetAccounts = await dbAllAsync('SELECT id FROM accounts WHERE user_id = ? AND account_type_id = 3 LIMIT 1', [userId]);
    const expenseAccounts = await dbAllAsync('SELECT id FROM accounts WHERE user_id = ? AND account_type_id = 4 LIMIT 1', [userId]);
    
    if (!assetAccounts.length || !expenseAccounts.length) {
      throw new Error('Default accounts not found');
    }

    const assetAccountId = assetAccounts[0].id;
    const expenseAccountId = expenseAccounts[0].id;

    // Determine currency ID
    let currencyId = 1; // EUR
    if (currency === 'CHF') currencyId = 27;
    if (currency === 'USD') currencyId = 12;

    const transactionDate = date || new Date().toISOString().split('T')[0];

    // Create transaction group
    const groupResult = await dbRunAsync(`
      INSERT INTO transaction_groups (created_at, updated_at, user_id, title)
      VALUES (NOW(), NOW(), ?, ?)
    `, [userId, `${shop} - ${transactionDate}`]);

    // Create transaction journal
    const journalResult = await dbRunAsync(`
      INSERT INTO transaction_journals (
        created_at, updated_at, user_id, user_group_id, transaction_type_id,
        transaction_group_id, transaction_currency_id, description, date,
        interest_date, book_date, process_date, \`order\`, tag_count, encrypted, completed
      ) VALUES (NOW(), NOW(), ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, 1)
    `, [userId, userGroupId, groupResult.lastID, currencyId, `Purchase at ${shop}`, transactionDate, transactionDate, transactionDate, transactionDate]);

    // Create withdrawal (from asset account)
    await dbRunAsync(`
      INSERT INTO transactions (
        created_at, updated_at, transaction_journal_id, account_id, amount,
        description, identifier
      ) VALUES (NOW(), NOW(), ?, ?, ?, ?, 0)
    `, [journalResult.lastID, assetAccountId, -Math.abs(amount), `Withdrawal: ${shop}`]);

    // Create expense (to expense account)
    await dbRunAsync(`
      INSERT INTO transactions (
        created_at, updated_at, transaction_journal_id, account_id, amount,
        description, identifier
      ) VALUES (NOW(), NOW(), ?, ?, ?, ?, 1)
    `, [journalResult.lastID, expenseAccountId, Math.abs(amount), `Expense: ${shop}`]);

    // Add receipt metadata if provided
    if (receiptPath) {
      await dbRunAsync(`
        INSERT INTO journal_meta (
          created_at, updated_at, transaction_journal_id, name, data, hash
        ) VALUES (NOW(), NOW(), ?, 'receipt_path', ?, ?)
      `, [journalResult.lastID, receiptPath, crypto.createHash('md5').update(receiptPath).digest('hex')]);
    }

    console.log(`✅ Created Firefly transaction: ${shop} - ${amount} ${currency}`);
    return journalResult.lastID;

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

module.exports = {
  verifySignature,
  handleWebhook,
  createFireflyTransaction,
  createFireflyIncomeTransaction,
  createFireflyAccount,
};