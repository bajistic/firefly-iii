#!/usr/bin/env node
/**
 * Migration script to update AI assistant app to use Firefly III database schema
 * This script will:
 * 1. Update the .env to point to firefly_iii database
 * 2. Migrate custom transaction data to Firefly III format
 * 3. Update the firefly.js integration to work with native Firefly schema
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER,
  DB_PASSWORD,
} = process.env;

if (!DB_USER || !DB_PASSWORD) {
  console.error('Error: DB_USER and DB_PASSWORD must be set in .env');
  process.exit(1);
}

// Database connections
const financePool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: 'finance',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

const fireflyPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: 'firefly_iii',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

async function updateEnvFile() {
  console.log('📝 Updating .env file to use firefly_iii database...');
  
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = await fs.readFile(envPath, 'utf8');
  
  // Update DB_NAME to firefly_iii
  const updatedContent = envContent.replace(
    /^DB_NAME=.*$/m,
    'DB_NAME=firefly_iii'
  );
  
  await fs.writeFile(envPath, updatedContent);
  console.log('✅ Updated .env file');
}

async function ensureFireflyUser() {
  console.log('👤 Ensuring Firefly III user exists...');
  
  // Check if user exists
  const [users] = await fireflyPool.query('SELECT id, email FROM users LIMIT 1');
  
  if (users.length === 0) {
    console.log('❌ No user found in Firefly III. Please create a user first by visiting http://localhost:8000');
    console.log('   After creating a user, run this script again.');
    process.exit(1);
  }
  
  const user = users[0];
  console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
  return user;
}

async function ensureUserGroup(userId) {
  console.log('👥 Ensuring user group exists...');
  
  // Check if user has a group membership
  const [memberships] = await fireflyPool.query(
    'SELECT user_group_id FROM group_memberships WHERE user_id = ?',
    [userId]
  );
  
  if (memberships.length === 0) {
    console.log('❌ User has no group membership. This is unusual for Firefly III.');
    process.exit(1);
  }
  
  const userGroupId = memberships[0].user_group_id;
  console.log(`✅ User belongs to group ID: ${userGroupId}`);
  return userGroupId;
}

async function createDefaultAccounts(userId, userGroupId) {
  console.log('🏦 Creating default accounts for AI assistant...');
  
  // Check if accounts already exist
  const [existingAccounts] = await fireflyPool.query(
    'SELECT id, name FROM accounts WHERE user_id = ? AND account_type_id IN (3, 4)',
    [userId]
  );
  
  if (existingAccounts.length >= 2) {
    console.log('✅ Accounts already exist');
    return {
      assetAccountId: existingAccounts.find(a => a.name.includes('Checking') || a.name.includes('Asset'))?.id,
      expenseAccountId: existingAccounts.find(a => a.name.includes('Expense') || a.name.includes('General'))?.id
    };
  }
  
  // Create asset account (checking account)
  const [assetResult] = await fireflyPool.execute(`
    INSERT INTO accounts (
      created_at, updated_at, user_id, user_group_id, account_type_id, 
      name, virtual_balance, iban, active, encrypted, \`order\`
    ) VALUES (NOW(), NOW(), ?, ?, 3, 'AI Assistant Checking Account', 0.00, NULL, 1, 0, 1)
  `, [userId, userGroupId]);
  
  // Create expense account
  const [expenseResult] = await fireflyPool.execute(`
    INSERT INTO accounts (
      created_at, updated_at, user_id, user_group_id, account_type_id, 
      name, virtual_balance, iban, active, encrypted, \`order\`
    ) VALUES (NOW(), NOW(), ?, ?, 4, 'AI Assistant Expenses', 0.00, NULL, 1, 0, 2)
  `, [userId, userGroupId]);
  
  console.log('✅ Created default accounts');
  return {
    assetAccountId: assetResult.insertId,
    expenseAccountId: expenseResult.insertId
  };
}

async function migrateTransactionData(userId, userGroupId, assetAccountId, expenseAccountId) {
  console.log('💰 Migrating transaction data from finance database...');
  
  // Get custom transactions
  const [customTransactions] = await financePool.query(`
    SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY id
  `);
  
  console.log(`📊 Found ${customTransactions.length} transactions to migrate`);
  
  for (const tx of customTransactions) {
    // Create transaction group
    const [groupResult] = await fireflyPool.execute(`
      INSERT INTO transaction_groups (created_at, updated_at, user_id, title)
      VALUES (?, ?, ?, ?)
    `, [
      tx.created_at || new Date(),
      tx.updated_at || new Date(),
      userId,
      `${tx.shop} - ${tx.date}`
    ]);
    
    const groupId = groupResult.insertId;
    
    // Determine currency ID
    let currencyId = 1; // Default to EUR
    if (tx.currency === 'CHF') currencyId = 27;
    if (tx.currency === 'USD') currencyId = 12;
    
    // Create transaction journal
    const [journalResult] = await fireflyPool.execute(`
      INSERT INTO transaction_journals (
        created_at, updated_at, user_id, user_group_id, transaction_type_id,
        transaction_group_id, transaction_currency_id, description, date,
        interest_date, book_date, process_date, \`order\`, tag_count, encrypted, completed
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, 1)
    `, [
      tx.created_at || new Date(),
      tx.updated_at || new Date(),
      userId,
      userGroupId,
      groupId,
      currencyId,
      `Purchase at ${tx.shop}`,
      tx.date,
      tx.date,
      tx.date,
      tx.date
    ]);
    
    const journalId = journalResult.insertId;
    
    // Create withdrawal transaction (from asset account)
    await fireflyPool.execute(`
      INSERT INTO transactions (
        created_at, updated_at, transaction_journal_id, account_id, amount,
        foreign_amount, foreign_currency_id, description, identifier
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, 0)
    `, [
      tx.created_at || new Date(),
      tx.updated_at || new Date(),
      journalId,
      assetAccountId,
      -Math.abs(tx.total),
      `Withdrawal: ${tx.shop}`
    ]);
    
    // Create expense transaction (to expense account)
    await fireflyPool.execute(`
      INSERT INTO transactions (
        created_at, updated_at, transaction_journal_id, account_id, amount,
        foreign_amount, foreign_currency_id, description, identifier
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, 1)
    `, [
      tx.created_at || new Date(),
      tx.updated_at || new Date(),
      journalId,
      expenseAccountId,
      Math.abs(tx.total),
      `Expense: ${tx.shop}`
    ]);
    
    // Add receipt metadata if exists
    if (tx.receipt_path) {
      await fireflyPool.execute(`
        INSERT INTO journal_meta (
          created_at, updated_at, transaction_journal_id, name, data, hash
        ) VALUES (?, ?, ?, 'receipt_path', ?, ?)
      `, [
        tx.created_at || new Date(),
        tx.updated_at || new Date(),
        journalId,
        tx.receipt_path,
        require('crypto').createHash('md5').update(tx.receipt_path).digest('hex')
      ]);
    }
  }
  
  console.log('✅ Transaction migration completed');
}

async function updateFireflyIntegration() {
  console.log('🔧 Updating firefly.js integration...');
  
  const fireflyJsPath = path.join(__dirname, 'src', 'firefly.js');
  let content = await fs.readFile(fireflyJsPath, 'utf8');
  
  // Update the sync functions to work with native Firefly schema
  // The integration should now work directly with the firefly_iii database
  
  const updatedContent = `const axios = require('axios');
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
      baseURL: \`\${FIREFLY_URL.replace(/\\/+$/, '')}/api/v1\`,
      headers: {
        Authorization: \`Bearer \${FIREFLY_TOKEN}\`,
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
    const groupResult = await dbRunAsync(\`
      INSERT INTO transaction_groups (created_at, updated_at, user_id, title)
      VALUES (NOW(), NOW(), ?, ?)
    \`, [userId, \`\${shop} - \${transactionDate}\`]);

    // Create transaction journal
    const journalResult = await dbRunAsync(\`
      INSERT INTO transaction_journals (
        created_at, updated_at, user_id, user_group_id, transaction_type_id,
        transaction_group_id, transaction_currency_id, description, date,
        interest_date, book_date, process_date, \\\`order\\\`, tag_count, encrypted, completed
      ) VALUES (NOW(), NOW(), ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, 1)
    \`, [userId, userGroupId, groupResult.lastID, currencyId, \`Purchase at \${shop}\`, transactionDate, transactionDate, transactionDate, transactionDate]);

    // Create withdrawal (from asset account)
    await dbRunAsync(\`
      INSERT INTO transactions (
        created_at, updated_at, transaction_journal_id, account_id, amount,
        description, identifier
      ) VALUES (NOW(), NOW(), ?, ?, ?, ?, 0)
    \`, [journalResult.lastID, assetAccountId, -Math.abs(amount), \`Withdrawal: \${shop}\`]);

    // Create expense (to expense account)
    await dbRunAsync(\`
      INSERT INTO transactions (
        created_at, updated_at, transaction_journal_id, account_id, amount,
        description, identifier
      ) VALUES (NOW(), NOW(), ?, ?, ?, ?, 1)
    \`, [journalResult.lastID, expenseAccountId, Math.abs(amount), \`Expense: \${shop}\`]);

    // Add receipt metadata if provided
    if (receiptPath) {
      await dbRunAsync(\`
        INSERT INTO journal_meta (
          created_at, updated_at, transaction_journal_id, name, data, hash
        ) VALUES (NOW(), NOW(), ?, 'receipt_path', ?, ?)
      \`, [journalResult.lastID, receiptPath, crypto.createHash('md5').update(receiptPath).digest('hex')]);
    }

    console.log(\`✅ Created Firefly transaction: \${shop} - \${amount} \${currency}\`);
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

    const result = await dbRunAsync(\`
      INSERT INTO accounts (
        created_at, updated_at, user_id, user_group_id, account_type_id,
        name, virtual_balance, iban, active, encrypted, \\\`order\\\`
      ) VALUES (NOW(), NOW(), ?, ?, ?, ?, 0.00, ?, 1, 0, 1)
    \`, [userId, userGroupId, accountTypeId, name, iban]);

    console.log(\`✅ Created Firefly account: \${name}\`);
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
};`;

  await fs.writeFile(fireflyJsPath, updatedContent);
  console.log('✅ Updated firefly.js integration');
}

async function main() {
  try {
    console.log('🚀 Starting AI assistant migration to Firefly III schema...\n');
    
    // Step 1: Update .env file
    await updateEnvFile();
    
    // Step 2: Ensure Firefly user exists
    const user = await ensureFireflyUser();
    
    // Step 3: Ensure user group exists
    const userGroupId = await ensureUserGroup(user.id);
    
    // Step 4: Create default accounts
    const { assetAccountId, expenseAccountId } = await createDefaultAccounts(user.id, userGroupId);
    
    // Step 5: Migrate transaction data
    await migrateTransactionData(user.id, userGroupId, assetAccountId, expenseAccountId);
    
    // Step 6: Update firefly.js integration
    await updateFireflyIntegration();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Restart your AI assistant app: npm run dev');
    console.log('   2. Test transaction creation through the AI assistant');
    console.log('   3. Verify data appears correctly in Firefly III at http://localhost:8000');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await financePool.end();
    await fireflyPool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };