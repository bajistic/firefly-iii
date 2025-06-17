const pdf = require('pdf-parse');
const { dbRunAsync, dbAllAsync } = require('./db');
const fs = require('fs').promises;

/**
 * Bank Statement Reconciliation System
 * 
 * This module handles:
 * 1. PDF bank statement parsing
 * 2. Transaction matching with existing records
 * 3. Discrepancy detection and resolution
 * 4. Exchange rate and fee corrections
 */

/**
 * Parse bank statement PDF and extract transactions
 */
async function parseBankStatement(pdfPath) {
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const data = await pdf(pdfBuffer);
    
    const transactions = extractTransactionsFromText(data.text);
    
    return {
      success: true,
      transactions,
      rawText: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info
      }
    };
  } catch (error) {
    console.error('❌ Error parsing PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract transaction data from bank statement text
 * This needs to be customized for your specific bank's format
 */
function extractTransactionsFromText(text) {
  const transactions = [];
  const lines = text.split('\n');
  
  // Common patterns for different banks
  const patterns = {
    // Swiss bank pattern (adjust for your bank)
    swiss: /(\d{2}\.\d{2}\.\d{4})\s+(.+?)\s+(CHF|EUR|USD)\s+([+-]?\d+[\.,]\d{2})/g,
    // European bank pattern
    european: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([+-]?\d+[\.,]\d{2})\s+(CHF|EUR|USD)/g,
    // Generic pattern
    generic: /(\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4})\s+(.+?)\s+([+-]?\d+[\.,]\d{2})/g
  };
  
  // Try each pattern
  for (const [bankType, pattern] of Object.entries(patterns)) {
    let match;
    const tempTransactions = [];
    
    while ((match = pattern.exec(text)) !== null) {
      const [_, dateStr, description, amountOrCurrency, currencyOrAmount] = match;
      
      // Determine amount and currency based on pattern
      let amount, currency;
      if (bankType === 'swiss') {
        currency = amountOrCurrency;
        amount = parseFloat(currencyOrAmount.replace(',', '.'));
      } else if (bankType === 'european') {
        amount = parseFloat(amountOrCurrency.replace(',', '.'));
        currency = currencyOrAmount;
      } else {
        amount = parseFloat(amountOrCurrency.replace(',', '.'));
        currency = 'CHF'; // Default
      }
      
      // Parse date
      const date = parseDate(dateStr);
      if (!date) continue;
      
      // Clean description
      const cleanDescription = description.trim().replace(/\s+/g, ' ');
      
      // Only include debits (expenses)
      if (amount < 0) {
        tempTransactions.push({
          date: date.toISOString().split('T')[0],
          description: cleanDescription,
          amount: Math.abs(amount),
          currency: currency || 'CHF',
          rawLine: match[0],
          source: 'bank_statement'
        });
      }
    }
    
    if (tempTransactions.length > 0) {
      transactions.push(...tempTransactions);
      break; // Use the first pattern that finds transactions
    }
  }
  
  return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Parse various date formats
 */
function parseDate(dateStr) {
  const formats = [
    /(\d{2})\.(\d{2})\.(\d{4})/,  // DD.MM.YYYY
    /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY  
    /(\d{2})-(\d{2})-(\d{4})/,    // DD-MM-YYYY
    /(\d{4})-(\d{2})-(\d{2})/     // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const [_, first, second, third] = match;
      
      // Determine if it's DD/MM/YYYY or YYYY/MM/DD
      if (third.length === 4) {
        // DD/MM/YYYY format
        const day = parseInt(first);
        const month = parseInt(second) - 1; // JS months are 0-indexed
        const year = parseInt(third);
        return new Date(year, month, day);
      } else {
        // YYYY/MM/DD format
        const year = parseInt(first);
        const month = parseInt(second) - 1;
        const day = parseInt(third);
        return new Date(year, month, day);
      }
    }
  }
  
  return null;
}

/**
 * Match bank statement transactions with existing database transactions
 */
async function matchTransactions(bankTransactions, dateRange = 7) {
  const matches = [];
  const unmatched = [];
  const discrepancies = [];
  
  for (const bankTx of bankTransactions) {
    const dbTransactions = await findPotentialMatches(bankTx, dateRange);
    
    if (dbTransactions.length === 0) {
      unmatched.push({
        type: 'missing_in_db',
        bankTransaction: bankTx,
        suggestion: 'Create new transaction'
      });
      continue;
    }
    
    // Find best match
    const bestMatch = findBestMatch(bankTx, dbTransactions);
    
    if (bestMatch.confidence > 0.8) {
      // Check for discrepancies
      const discrepancy = checkDiscrepancies(bankTx, bestMatch.transaction);
      
      if (discrepancy) {
        discrepancies.push({
          type: 'discrepancy',
          bankTransaction: bankTx,
          dbTransaction: bestMatch.transaction,
          discrepancy,
          confidence: bestMatch.confidence
        });
      } else {
        matches.push({
          type: 'match',
          bankTransaction: bankTx,
          dbTransaction: bestMatch.transaction,
          confidence: bestMatch.confidence
        });
      }
    } else {
      unmatched.push({
        type: 'low_confidence',
        bankTransaction: bankTx,
        potentialMatches: dbTransactions,
        bestMatch: bestMatch
      });
    }
  }
  
  return {
    matches,
    unmatched,
    discrepancies,
    summary: {
      total: bankTransactions.length,
      matched: matches.length,
      unmatched: unmatched.length,
      discrepancies: discrepancies.length
    }
  };
}

/**
 * Find potential matches in database within date range
 */
async function findPotentialMatches(bankTx, dateRange) {
  const startDate = new Date(bankTx.date);
  startDate.setDate(startDate.getDate() - dateRange);
  const endDate = new Date(bankTx.date);
  endDate.setDate(endDate.getDate() + dateRange);
  
  const transactions = await dbAllAsync(`
    SELECT 
      t.id,
      t.shop,
      t.date,
      t.total,
      t.currency,
      t.receipt_path
    FROM transactions t
    WHERE t.date BETWEEN ? AND ?
    ORDER BY ABS(DATEDIFF(t.date, ?)) ASC
  `, [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    bankTx.date
  ]);
  
  return transactions;
}

/**
 * Find best match using multiple criteria
 */
function findBestMatch(bankTx, dbTransactions) {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const dbTx of dbTransactions) {
    const score = calculateMatchScore(bankTx, dbTx);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = dbTx;
    }
  }
  
  return {
    transaction: bestMatch,
    confidence: bestScore
  };
}

/**
 * Calculate match score between bank and DB transaction
 */
function calculateMatchScore(bankTx, dbTx) {
  let score = 0;
  
  // Date proximity (max 40 points)
  const dateDiff = Math.abs(new Date(bankTx.date) - new Date(dbTx.date));
  const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
  score += Math.max(0, 40 - (daysDiff * 10));
  
  // Amount similarity (max 30 points)
  const amountDiff = Math.abs(bankTx.amount - dbTx.total);
  const amountRatio = amountDiff / Math.max(bankTx.amount, dbTx.total);
  score += Math.max(0, 30 - (amountRatio * 100));
  
  // Description similarity (max 30 points)
  const descSimilarity = calculateStringSimilarity(
    bankTx.description.toLowerCase(),
    dbTx.shop.toLowerCase()
  );
  score += descSimilarity * 30;
  
  return score / 100; // Normalize to 0-1
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

/**
 * Check for discrepancies between bank and DB transaction
 */
function checkDiscrepancies(bankTx, dbTx) {
  const discrepancies = [];
  
  // Amount discrepancy
  const amountDiff = Math.abs(bankTx.amount - dbTx.total);
  if (amountDiff > 0.01) {
    discrepancies.push({
      field: 'amount',
      bank: bankTx.amount,
      database: dbTx.total,
      difference: amountDiff,
      type: 'amount_mismatch'
    });
  }
  
  // Currency discrepancy
  if (bankTx.currency !== dbTx.currency) {
    discrepancies.push({
      field: 'currency',
      bank: bankTx.currency,
      database: dbTx.currency,
      type: 'currency_mismatch'
    });
  }
  
  // Date discrepancy (more than 1 day)
  const dateDiff = Math.abs(new Date(bankTx.date) - new Date(dbTx.date));
  const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
  if (daysDiff > 1) {
    discrepancies.push({
      field: 'date',
      bank: bankTx.date,
      database: dbTx.date,
      difference: `${daysDiff.toFixed(1)} days`,
      type: 'date_mismatch'
    });
  }
  
  return discrepancies.length > 0 ? discrepancies : null;
}

/**
 * Apply reconciliation corrections to database
 */
async function applyReconciliation(reconciliationId, corrections) {
  const results = [];
  
  for (const correction of corrections) {
    try {
      if (correction.action === 'update_amount') {
        await dbRunAsync(`
          UPDATE transactions 
          SET total = ?, updated_at = NOW()
          WHERE id = ?
        `, [correction.newAmount, correction.transactionId]);
        
        results.push({
          success: true,
          action: 'update_amount',
          transactionId: correction.transactionId,
          oldAmount: correction.oldAmount,
          newAmount: correction.newAmount
        });
        
      } else if (correction.action === 'update_currency') {
        await dbRunAsync(`
          UPDATE transactions 
          SET currency = ?, updated_at = NOW()
          WHERE id = ?
        `, [correction.newCurrency, correction.transactionId]);
        
        results.push({
          success: true,
          action: 'update_currency',
          transactionId: correction.transactionId,
          oldCurrency: correction.oldCurrency,
          newCurrency: correction.newCurrency
        });
        
      } else if (correction.action === 'create_transaction') {
        const result = await dbRunAsync(`
          INSERT INTO transactions (shop, date, time, total, currency, account_id, created_at, updated_at)
          VALUES (?, ?, '00:00:00', ?, ?, 1, NOW(), NOW())
        `, [
          correction.description,
          correction.date,
          correction.amount,
          correction.currency
        ]);
        
        results.push({
          success: true,
          action: 'create_transaction',
          transactionId: result.lastID,
          description: correction.description,
          amount: correction.amount
        });
      }
      
    } catch (error) {
      results.push({
        success: false,
        action: correction.action,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  parseBankStatement,
  matchTransactions,
  applyReconciliation,
  extractTransactionsFromText,
  calculateMatchScore
};