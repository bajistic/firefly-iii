#!/usr/bin/env node

/**
 * Finance Database to Firefly III Migration Script
 * 
 * Migrates data from your custom finance MariaDB database to Firefly III
 * Based on actual analysis of your data:
 * - 81 transactions
 * - 1 income entry  
 * - 187 items linked to transactions
 * - Currencies: EUR, CHF, USD
 */

const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');

const CONFIG = {
  // Source database (your finance DB)
  SOURCE_DB: {
    host: '192.168.1.100',
    port: 3306,
    user: 'bayarbileg',
    password: 'budagch1n',
    database: 'finance'
  },

  // Target Firefly III
  FIREFLY_URL: 'http://localhost:3001',
  FIREFLY_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYmIzMjJhYzVlZTU4ZjZjYTE1ZTI2ZDEzMGM2OGZlMDYzNGNjNGIyMTdlNjcyZDRkN2Y1NGRmNWU4Nzg5MTMwNDczOGQ1MWUxMmU5OTA2NmMiLCJpYXQiOjE3NTAxNTE5MTguNDc5MTYzLCJuYmYiOjE3NTAxNTE5MTguNDc5MTY3LCJleHAiOjE3ODE2ODc5MTguMzc3MjcsInN1YiI6IjEiLCJzY29wZXMiOltdfQ.l_OdYgGy4jmd2Em6MG94xuGVAGXffVCLi9lRJRPcQegBq69EoQfoAvnuZS_SHDQRleaywUBXgJK3wdbwd2ItLrczaZZHVVO2P8BHhHt-2yq1xnegUksKEqnxwQetINpEgSNh6rdOz31YEJGQMQwIDWp8qKXvlGSeyBmJdwrE_xobNAselxQ4ASnn9TuSYW6YiYaCHZgZDIOJfTC6UvKlRZS6jRjEw_Nm508f2sQj8jPQh1vt1vjX572aVJRrIGGMAjzx35SD_kioYbVhCXQcnpduXnVYG_YXXSOXX_NrWBgMKWaZryYu9Vjsat37__XIE-ZJuRM--trj9OZ02ydhDZsP69e77Url_iAtOlUaTYk8ZJZiGpEKl2TwLhJy513lEVortw_5EpeP-Cr24P9yC1Q0nV4oAY0ezBFVYVOgn8DWUJWGfh0_htgjMuPHbaggRqoSyCy3plkBMplT15B9VuMbD5kV-xTm_aM0vz5MjyxMKMArdxKCdAsbrrCFfGCOkklgDiI6d88whu_O7tfl_tCV7li-dogEr0zkoB1MK1k1i3xWNWwAY5KrIMPQs-W-0GB4apwp0NiqDSgDRy7giX6eOPeI9inB9c0qwYHNodpY5tTUljsy-I8QNEfoGs0GKZmxCWvg4BTPNuwSXr-yqelgxavtOcDDjpR1EwTosDw', // Set this after getting token from Firefly III

  // Migration settings
  DRY_RUN: false,
  BACKUP_FILE: './finance_migration_backup.json',
  BATCH_SIZE: 5,
  DELAY_MS: 1000 // Delay between API calls
};

class FinanceMigrator {
  constructor(config) {
    this.config = config;
    this.connection = null;
    this.stats = {
      transactions: { total: 0, migrated: 0, errors: 0 },
      income: { total: 0, migrated: 0, errors: 0 },
      accounts: { created: 0, errors: 0 }
    };
    this.backup = {
      transactions: [],
      income: [],
      items: []
    };
    this.defaultAccounts = new Map(); // Store created default accounts
  }

  async init() {
    console.log('🔧 Initializing Finance Migration...');

    // Connect to source database
    this.connection = await mysql.createConnection(this.config.SOURCE_DB);
    console.log('✅ Connected to finance database');

    // Test Firefly connection
    await this.testFireflyConnection();

    console.log('✅ Initialization complete');
  }

  async testFireflyConnection() {
    try {
      if (!this.config.FIREFLY_TOKEN) {
        console.log('⚠️  Firefly III token not set');
        console.log('   1. Go to http://localhost:3001');
        console.log('   2. Register/login');
        console.log('   3. Go to Options > Profile > OAuth');
        console.log('   4. Create Personal Access Token');
        console.log('   5. Set FIREFLY_TOKEN in this script');
        return;
      }

      const response = await axios.get(`${this.config.FIREFLY_URL}/api/v1/about`, {
        headers: this.getAuthHeaders(),
        timeout: 5000
      });
      console.log(`✅ Connected to Firefly III v${response.data.data.version}`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Invalid Firefly III token');
      } else {
        console.log(`⚠️  Firefly III connection issue: ${error.message}`);
        console.log('   Make sure Firefly III is running and accessible');
      }
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.config.FIREFLY_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.api+json'
    };
  }

  async backupData() {
    console.log('💾 Creating backup of source data...');

    // Backup transactions
    const [transactions] = await this.connection.execute(`
            SELECT id, shop, date, time, total, currency, discount, receipt_path, 
                   account_id, description, created_at, updated_at
            FROM transactions 
            ORDER BY date DESC, id DESC
        `);

    // Backup income
    const [income] = await this.connection.execute(`
            SELECT id, type, amount, date, description, account_id
            FROM income 
            ORDER BY date DESC
        `);

    // Backup items
    const [items] = await this.connection.execute(`
            SELECT id, transaction_id, name, quantity, price, category, discount
            FROM items 
            ORDER BY transaction_id, id
        `);

    this.backup.transactions = transactions;
    this.backup.income = income;
    this.backup.items = items;

    // Save backup to file
    fs.writeFileSync(this.config.BACKUP_FILE, JSON.stringify(this.backup, null, 2));

    console.log(`✅ Backup saved to ${this.config.BACKUP_FILE}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Income entries: ${income.length}`);
    console.log(`   - Items: ${items.length}`);

    this.stats.transactions.total = transactions.length;
    this.stats.income.total = income.length;
  }

  async createDefaultAccounts() {
    console.log('🏦 Creating default accounts...');

    const accounts = [
      { name: 'Main Checking Account', type: 'asset', role: 'defaultAsset', currency: 'CHF', opening_balance: '0' },
      { name: 'EUR Account', type: 'asset', role: 'defaultAsset', currency: 'EUR', opening_balance: '0' },
      { name: 'USD Account', type: 'asset', role: 'defaultAsset', currency: 'USD', opening_balance: '0' }
    ];

    for (const account of accounts) {
      try {
        if (this.config.DRY_RUN) {
          console.log(`  [DRY RUN] Would create account: ${account.name} (${account.type}, ${account.currency})`);
          this.defaultAccounts.set(account.currency, `fake_${account.currency.toLowerCase()}_id`);
        } else {
          const payload = {
            name: account.name,
            type: account.type,
            currency_code: account.currency
          };

          if (account.role) {
            payload.account_role = account.role;
          }

          if (account.opening_balance) {
            payload.opening_balance = account.opening_balance;
            payload.opening_balance_date = new Date().toISOString().split('T')[0];
          }

          const response = await axios.post(`${this.config.FIREFLY_URL}/api/v1/accounts`, payload, {
            headers: this.getAuthHeaders()
          });

          this.defaultAccounts.set(account.currency, response.data.data.id);
          console.log(`  ✅ Created account: ${account.name} (ID: ${response.data.data.id})`);
        }
        this.stats.accounts.created++;
        await this.delay();
      } catch (error) {
        console.error(`  ❌ Failed to create account ${account.name}: ${error.response?.data?.message || error.message}`);
        this.stats.accounts.errors++;
      }
    }
  }

  async migrateTransactions() {
    console.log('💳 Migrating transactions...');

    // Group items by transaction_id
    const itemsByTransaction = new Map();
    this.backup.items.forEach(item => {
      if (!itemsByTransaction.has(item.transaction_id)) {
        itemsByTransaction.set(item.transaction_id, []);
      }
      itemsByTransaction.get(item.transaction_id).push(item);
    });

    for (const transaction of this.backup.transactions) {
      try {
        const items = itemsByTransaction.get(transaction.id) || [];
        const sourceAccountId = this.defaultAccounts.get(transaction.currency);

        // Build description from shop and items
        let description = transaction.shop || 'Expense';
        if (transaction.description) {
          description += ` - ${transaction.description}`;
        }

        // Build detailed notes with items
        const notes = this.buildTransactionNotes(transaction, items);

        // Get categories from items
        const categories = [...new Set(items.map(item => item.category).filter(Boolean))];

        const fireflyTransaction = {
          type: 'withdrawal',
          description: description,
          amount: Math.abs(transaction.total).toString(),
          date: this.formatDate(transaction.date),
          currency_code: transaction.currency,
          category_name: categories.length > 0 ? categories[0] : undefined,
          notes: notes,
          tags: this.buildTags(transaction, items)
        };

        // Add source/destination based on availability
        if (sourceAccountId && !sourceAccountId.startsWith('fake_')) {
          fireflyTransaction.source_id = sourceAccountId;
        } else {
          fireflyTransaction.source_name = `${transaction.currency} Account`;
        }
        fireflyTransaction.destination_name = transaction.shop || 'Unknown Merchant';

        if (this.config.DRY_RUN) {
          console.log(`  [DRY RUN] Would create: ${description} (${transaction.total} ${transaction.currency})`);
        } else {
          const payload = {
            group_title: description,
            transactions: [fireflyTransaction]
          };

          const response = await axios.post(`${this.config.FIREFLY_URL}/api/v1/transactions`, payload, {
            headers: this.getAuthHeaders()
          });

          console.log(`  ✅ Migrated: ${description}`);
          await this.delay();
        }

        this.stats.transactions.migrated++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate transaction ${transaction.id}: ${error.response?.data?.message || error.message}`);
        this.stats.transactions.errors++;
      }
    }
  }

  async migrateIncome() {
    console.log('💰 Migrating income entries...');

    for (const income of this.backup.income) {
      try {
        const destinationAccountId = this.defaultAccounts.get('CHF'); // Assume CHF for income

        const fireflyTransaction = {
          type: 'deposit',
          description: income.description || `${income.type} income`,
          amount: Math.abs(income.amount).toString(),
          date: this.formatDate(income.date),
          source_name: income.type || 'Income Source',
          currency_code: 'CHF', // Assume CHF for income
          category_name: 'Salary'
        };

        // Add destination based on availability
        if (destinationAccountId && !destinationAccountId.startsWith('fake_')) {
          fireflyTransaction.destination_id = destinationAccountId;
        } else {
          fireflyTransaction.destination_name = 'Main Checking Account';
        }

        if (this.config.DRY_RUN) {
          console.log(`  [DRY RUN] Would create income: ${fireflyTransaction.description} (${income.amount} CHF)`);
        } else {
          const payload = {
            group_title: fireflyTransaction.description,
            transactions: [fireflyTransaction]
          };

          const response = await axios.post(`${this.config.FIREFLY_URL}/api/v1/transactions`, payload, {
            headers: this.getAuthHeaders()
          });

          console.log(`  ✅ Migrated income: ${fireflyTransaction.description}`);
          await this.delay();
        }

        this.stats.income.migrated++;
      } catch (error) {
        console.error(`  ❌ Failed to migrate income ${income.id}: ${error.response?.data?.message || error.message}`);
        this.stats.income.errors++;
      }
    }
  }

  // Helper methods
  formatDate(dateInput) {
    if (!dateInput) return new Date().toISOString().split('T')[0];

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }

  buildTransactionNotes(transaction, items) {
    const notes = [];

    if (transaction.discount && transaction.discount > 0) {
      notes.push(`Discount: ${transaction.discount}`);
    }

    if (transaction.receipt_path) {
      notes.push(`Receipt: ${transaction.receipt_path}`);
    }

    if (items.length > 0) {
      notes.push('\\nItems purchased:');
      items.forEach(item => {
        const quantity = item.quantity ? `${item.quantity}x ` : '';
        const price = item.price ? ` - ${item.price} ${transaction.currency}` : '';
        const category = item.category ? ` [${item.category}]` : '';
        notes.push(`• ${quantity}${item.name}${price}${category}`);
      });
    }

    return notes.join('\\n');
  }

  buildTags(transaction, items) {
    const tags = [];

    if (transaction.shop) {
      tags.push(transaction.shop.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    }

    // Add categories as tags
    const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
    tags.push(...categories.map(cat => cat.toLowerCase().replace(/[^a-z0-9]/g, '-')));

    // Add currency as tag
    tags.push(transaction.currency.toLowerCase());

    return [...new Set(tags)].slice(0, 5); // Remove duplicates, limit to 5
  }

  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.config.DELAY_MS));
  }

  async run() {
    try {
      await this.init();
      console.log('🔍 Starting backup process...');
      await this.backupData();
      console.log('✅ Backup completed');

      if (!this.config.FIREFLY_TOKEN) {
        console.log('\\n⚠️  Cannot proceed without Firefly III token');
        return;
      }

      console.log(`\\n🚀 Starting migration (DRY_RUN: ${this.config.DRY_RUN})...`);

      await this.createDefaultAccounts();
      await this.migrateTransactions();
      await this.migrateIncome();

      this.printSummary();

    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      if (error.response?.data) {
        console.error('API Error:', error.response.data);
      }
    } finally {
      if (this.connection) {
        await this.connection.end();
      }
    }
  }

  printSummary() {
    console.log('\\n📊 Migration Summary:');
    console.log('=====================================');
    console.log(`Accounts: ${this.stats.accounts.created} created (${this.stats.accounts.errors} errors)`);
    console.log(`Transactions: ${this.stats.transactions.migrated}/${this.stats.transactions.total} (${this.stats.transactions.errors} errors)`);
    console.log(`Income: ${this.stats.income.migrated}/${this.stats.income.total} (${this.stats.income.errors} errors)`);
    console.log('=====================================');

    if (this.config.DRY_RUN) {
      console.log('\\n⚠️  This was a DRY RUN - no data was actually migrated.');
      console.log('   Set DRY_RUN: false to perform actual migration.');
    } else {
      console.log('\\n✅ Migration completed!');
      console.log('   Check your Firefly III at http://localhost:3001');
    }
  }
}

// Usage
if (require.main === module) {
  const migrator = new FinanceMigrator(CONFIG);
  migrator.run().catch(console.error);
}

module.exports = FinanceMigrator;
