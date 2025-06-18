#!/usr/bin/env node
/**
 * Carefully re-import custom transaction data with proper error handling
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const financePool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'finance',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

const fireflyPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'firefly_iii',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

async function importDataCarefully() {
  try {
    console.log('📊 Carefully importing transaction data...');
    
    // Get user info
    const [users] = await fireflyPool.query('SELECT id FROM users LIMIT 1');
    const userId = users[0].id;
    
    const [memberships] = await fireflyPool.query('SELECT user_group_id FROM group_memberships WHERE user_id = ?', [userId]);
    const userGroupId = memberships[0].user_group_id;
    
    // Get accounts
    const [assetAccounts] = await fireflyPool.query('SELECT id FROM accounts WHERE user_id = ? AND account_type_id = 3 LIMIT 1', [userId]);
    const [expenseAccounts] = await fireflyPool.query('SELECT id FROM accounts WHERE user_id = ? AND account_type_id = 4 LIMIT 1', [userId]);
    
    const assetAccountId = assetAccounts[0].id;
    const expenseAccountId = expenseAccounts[0].id;
    
    // Get custom transactions in small batches
    const [customTransactions] = await financePool.query(`
      SELECT * FROM transactions WHERE deleted_at IS NULL ORDER BY id LIMIT 10
    `);
    
    console.log(`Found ${customTransactions.length} transactions to import`);
    
    for (const tx of customTransactions) {
      try {
        // Determine currency ID with fallback
        let currencyId = 1; // Default EUR
        if (tx.currency === 'CHF') currencyId = 27;
        if (tx.currency === 'USD') currencyId = 12;
        
        // Validate currency exists
        const [currencyCheck] = await fireflyPool.query('SELECT symbol FROM transaction_currencies WHERE id = ?', [currencyId]);
        if (!currencyCheck.length || !currencyCheck[0].symbol) {
          console.warn(`⚠️ Currency ID ${currencyId} has no symbol, using EUR instead`);
          currencyId = 1;
        }
        
        const transactionDate = tx.date || new Date().toISOString().split('T')[0];
        
        // Create transaction group
        const [groupResult] = await fireflyPool.execute(`
          INSERT INTO transaction_groups (created_at, updated_at, user_id, title)
          VALUES (?, ?, ?, ?)
        `, [
          tx.created_at || new Date(),
          tx.updated_at || new Date(),
          userId,
          `${tx.shop} - ${transactionDate}`
        ]);
        
        const groupId = groupResult.insertId;
        
        // Create transaction journal with explicit currency
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
          transactionDate,
          transactionDate,
          transactionDate,
          transactionDate
        ]);
        
        const journalId = journalResult.insertId;
        
        // Create withdrawal transaction
        await fireflyPool.execute(`
          INSERT INTO transactions (
            created_at, updated_at, transaction_journal_id, account_id, amount,
            description, identifier
          ) VALUES (?, ?, ?, ?, ?, ?, 0)
        `, [
          tx.created_at || new Date(),
          tx.updated_at || new Date(),
          journalId,
          assetAccountId,
          -Math.abs(tx.total),
          `Withdrawal: ${tx.shop}`
        ]);
        
        // Create expense transaction
        await fireflyPool.execute(`
          INSERT INTO transactions (
            created_at, updated_at, transaction_journal_id, account_id, amount,
            description, identifier
          ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [
          tx.created_at || new Date(),
          tx.updated_at || new Date(),
          journalId,
          expenseAccountId,
          Math.abs(tx.total),
          `Expense: ${tx.shop}`
        ]);
        
        console.log(`✅ Imported: ${tx.shop} - ${tx.total} ${tx.currency}`);
        
      } catch (error) {
        console.error(`❌ Failed to import transaction ${tx.id}:`, error.message);
        // Continue with next transaction
      }
    }
    
    console.log('🎉 Import completed');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await financePool.end();
    await fireflyPool.end();
  }
}

if (require.main === module) {
  importDataCarefully();
}