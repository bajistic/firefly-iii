const { dbRunAsync, dbAllAsync } = require('./db');
require('dotenv').config();

/**
 * Simple transaction creation for the original finance database
 * No more Firefly III complications - just pure simplicity
 */
async function createTransaction(shop, amount, currency = 'CHF', date = null, receiptPath = null, items = []) {
  try {
    const transactionDate = date || new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0];
    
    // Create transaction in finance database
    const result = await dbRunAsync(`
      INSERT INTO transactions (shop, date, time, total, currency, receipt_path, account_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [shop, transactionDate, time, amount, currency, receiptPath, 1]);
    
    const transactionId = result.lastID;
    
    // Insert items if provided
    for (const item of items) {
      await dbRunAsync(`
        INSERT INTO items (transaction_id, name, quantity, price, category)
        VALUES (?, ?, ?, ?, ?)
      `, [transactionId, item.name, item.quantity || 1, item.price || 0, item.category || 'general']);
    }
    
    console.log(`✅ Created transaction: ${shop} - ${amount} ${currency} (ID: ${transactionId})`);
    return {
      success: true,
      id: transactionId,
      shop,
      amount,
      currency,
      date: transactionDate
    };
    
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create income entry
 */
async function createIncome(type, amount, description = '', date = null) {
  try {
    const incomeDate = date || new Date().toISOString().split('T')[0];
    
    const result = await dbRunAsync(`
      INSERT INTO income (type, amount, date, description, account_id)
      VALUES (?, ?, ?, ?, ?)
    `, [type, amount, incomeDate, description, 1]);
    
    console.log(`✅ Created income: ${type} - ${amount} CHF (ID: ${result.lastID})`);
    return {
      success: true,
      id: result.lastID,
      type,
      amount,
      description,
      date: incomeDate
    };
    
  } catch (error) {
    console.error('❌ Error creating income:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create account
 */
async function createAccount(name, type = 'checking', description = '', balance = 0.0) {
  try {
    const result = await dbRunAsync(`
      INSERT INTO accounts (name, description, type, balance)
      VALUES (?, ?, ?, ?)
    `, [name, description, type, balance]);
    
    console.log(`✅ Created account: ${name} (ID: ${result.lastID})`);
    return {
      success: true,
      id: result.lastID,
      name,
      type,
      balance
    };
    
  } catch (error) {
    console.error('❌ Error creating account:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get recent transactions
 */
async function getRecentTransactions(limit = 10) {
  try {
    const transactions = await dbAllAsync(`
      SELECT 
        t.id,
        t.shop,
        t.date,
        t.time,
        t.total,
        t.currency,
        t.receipt_path,
        a.name as account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      ORDER BY t.date DESC, t.time DESC
      LIMIT ?
    `, [limit]);
    
    return transactions;
  } catch (error) {
    console.error('❌ Error fetching recent transactions:', error);
    return [];
  }
}

/**
 * Get transaction with items
 */
async function getTransactionWithItems(transactionId) {
  try {
    const [transaction] = await dbAllAsync(`
      SELECT t.*, a.name as account_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.id = ?
    `, [transactionId]);
    
    if (!transaction) return null;
    
    const items = await dbAllAsync(`
      SELECT * FROM items WHERE transaction_id = ?
    `, [transactionId]);
    
    return {
      ...transaction,
      items
    };
  } catch (error) {
    console.error('❌ Error fetching transaction with items:', error);
    return null;
  }
}

// Simplified exports - no more Firefly complications!
module.exports = {
  createTransaction,
  createIncome,
  createAccount,
  getRecentTransactions,
  getTransactionWithItems,
  // Legacy aliases for compatibility
  createSyncedTransaction: createTransaction,
  createSyncedIncome: createIncome,
  createFireflyAccount: createAccount
};