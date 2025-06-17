#!/usr/bin/env node

/**
 * Safe Migration Script: Custom Finance DB → Firefly III
 * 
 * This script safely migrates data from your custom SQLite database
 * to Firefly III using the REST API.
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

// Configuration
const CONFIG = {
    FIREFLY_URL: 'http://localhost:3001',
    FIREFLY_TOKEN: null, // Will be set after first setup
    SQLITE_PATH: './firefly-iii/src/expenses.db',
    BACKUP_PATH: './migration_backup.json',
    DRY_RUN: true, // Set to false to actually perform migration
    BATCH_SIZE: 10
};

class FireflyMigrator {
    constructor(config) {
        this.config = config;
        this.db = null;
        this.stats = {
            accounts: { total: 0, migrated: 0, errors: 0 },
            transactions: { total: 0, migrated: 0, errors: 0 },
            income: { total: 0, migrated: 0, errors: 0 }
        };
        this.accountMap = new Map(); // Map custom account IDs to Firefly IDs
        this.backupData = {
            accounts: [],
            transactions: [],
            income: [],
            items: []
        };
    }

    async init() {
        console.log('🔧 Initializing Firefly III Migration...');
        
        // Check if SQLite database exists
        if (!fs.existsSync(this.config.SQLITE_PATH)) {
            throw new Error(`SQLite database not found at: ${this.config.SQLITE_PATH}`);
        }

        // Open SQLite database
        this.db = new sqlite3.Database(this.config.SQLITE_PATH, sqlite3.OPEN_READONLY);
        
        // Test Firefly III connection
        await this.testFireflyConnection();
        
        console.log('✅ Initialization complete');
    }

    async testFireflyConnection() {
        try {
            const response = await axios.get(`${this.config.FIREFLY_URL}/api/v1/about`, {
                headers: this.getAuthHeaders(),
                timeout: 5000
            });
            console.log(`✅ Connected to Firefly III v${response.data.data.version}`);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('⚠️  Need to set up API token in Firefly III first');
                console.log('   1. Go to http://localhost:3001');
                console.log('   2. Create account and login');
                console.log('   3. Go to Options > Profile > OAuth');
                console.log('   4. Create Personal Access Token');
                console.log('   5. Update CONFIG.FIREFLY_TOKEN in this script');
                process.exit(1);
            }
            throw new Error(`Cannot connect to Firefly III: ${error.message}`);
        }
    }

    getAuthHeaders() {
        if (!this.config.FIREFLY_TOKEN) {
            return {};
        }
        return {
            'Authorization': `Bearer ${this.config.FIREFLY_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json'
        };
    }

    async backupOriginalData() {
        console.log('💾 Creating backup of original data...');
        
        const queries = {
            accounts: new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM accounts', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            transactions: new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM transactions', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            income: new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM income', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            }),
            items: new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM items', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            })
        };

        try {
            this.backupData.accounts = await queries.accounts;
            this.backupData.transactions = await queries.transactions;
            this.backupData.income = await queries.income;
            this.backupData.items = await queries.items;

            // Write backup to file
            fs.writeFileSync(this.config.BACKUP_PATH, JSON.stringify(this.backupData, null, 2));
            
            console.log(`✅ Backup created: ${this.config.BACKUP_PATH}`);
            console.log(`   - Accounts: ${this.backupData.accounts.length}`);
            console.log(`   - Transactions: ${this.backupData.transactions.length}`);
            console.log(`   - Income: ${this.backupData.income.length}`);
            console.log(`   - Items: ${this.backupData.items.length}`);
        } catch (error) {
            throw new Error(`Backup failed: ${error.message}`);
        }
    }

    async migrateAccounts() {
        console.log('🏦 Migrating accounts...');
        
        for (const account of this.backupData.accounts) {
            try {
                this.stats.accounts.total++;
                
                const fireflyAccount = {
                    name: account.name,
                    type: this.mapAccountType(account.type),
                    opening_balance: account.balance?.toString() || '0',
                    notes: account.description || '',
                    currency_code: 'CHF' // Default currency from your schema
                };

                if (this.config.DRY_RUN) {
                    console.log(`  [DRY RUN] Would create account: ${account.name} (${fireflyAccount.type})`);
                    this.accountMap.set(account.id, `ff_account_${account.id}`);
                } else {
                    const response = await axios.post(`${this.config.FIREFLY_URL}/api/v1/accounts`, {
                        data: {
                            type: 'accounts',
                            attributes: fireflyAccount
                        }
                    }, { headers: this.getAuthHeaders() });
                    
                    this.accountMap.set(account.id, response.data.data.id);
                    console.log(`  ✅ Created account: ${account.name}`);
                }
                
                this.stats.accounts.migrated++;
            } catch (error) {
                console.error(`  ❌ Failed to migrate account ${account.name}: ${error.message}`);
                this.stats.accounts.errors++;
            }
        }
    }

    async migrateTransactions() {
        console.log('💳 Migrating transactions...');
        
        // Group items by transaction_id for batch processing
        const itemsByTransaction = new Map();
        this.backupData.items.forEach(item => {
            if (!itemsByTransaction.has(item.transaction_id)) {
                itemsByTransaction.set(item.transaction_id, []);
            }
            itemsByTransaction.get(item.transaction_id).push(item);
        });

        for (const transaction of this.backupData.transactions) {
            try {
                this.stats.transactions.total++;
                
                const items = itemsByTransaction.get(transaction.id) || [];
                const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
                
                const fireflyTransaction = {
                    type: 'withdrawal', // Your transactions appear to be expenses
                    description: this.buildTransactionDescription(transaction, items),
                    date: this.formatDate(transaction.date),
                    amount: Math.abs(transaction.total).toString(),
                    source_name: this.accountMap.get(transaction.account_id) ? undefined : 'Default Asset Account',
                    source_id: this.accountMap.get(transaction.account_id),
                    destination_name: transaction.shop || 'Cash Account',
                    currency_code: transaction.currency || 'CHF',
                    category_name: categories.length > 0 ? categories[0] : undefined,
                    notes: this.buildTransactionNotes(transaction, items),
                    tags: this.buildTransactionTags(transaction, items)
                };

                if (this.config.DRY_RUN) {
                    console.log(`  [DRY RUN] Would create transaction: ${fireflyTransaction.description} (${fireflyTransaction.amount} ${fireflyTransaction.currency_code})`);
                } else {
                    const response = await axios.post(`${this.config.FIREFLY_URL}/api/v1/transactions`, {
                        data: {
                            type: 'transactions',
                            attributes: {
                                group_title: fireflyTransaction.description,
                                transactions: [fireflyTransaction]
                            }
                        }
                    }, { headers: this.getAuthHeaders() });
                    
                    console.log(`  ✅ Created transaction: ${fireflyTransaction.description}`);
                }
                
                this.stats.transactions.migrated++;
            } catch (error) {
                console.error(`  ❌ Failed to migrate transaction ${transaction.id}: ${error.message}`);
                this.stats.transactions.errors++;
            }
        }
    }

    async migrateIncome() {
        console.log('💰 Migrating income entries...');
        
        for (const income of this.backupData.income) {
            try {
                this.stats.income.total++;
                
                const fireflyTransaction = {
                    type: 'deposit',
                    description: income.description || `${income.type} Income`,
                    date: this.formatDate(income.date),
                    amount: Math.abs(income.amount).toString(),
                    source_name: income.type || 'Income Source',
                    destination_id: this.accountMap.get(income.account_id),
                    destination_name: this.accountMap.get(income.account_id) ? undefined : 'Default Asset Account',
                    currency_code: 'CHF',
                    category_name: 'Income'
                };

                if (this.config.DRY_RUN) {
                    console.log(`  [DRY RUN] Would create income: ${fireflyTransaction.description} (${fireflyTransaction.amount} CHF)`);
                } else {
                    const response = await axios.post(`${this.config.FIREFLY_URL}/api/v1/transactions`, {
                        data: {
                            type: 'transactions',
                            attributes: {
                                group_title: fireflyTransaction.description,
                                transactions: [fireflyTransaction]
                            }
                        }
                    }, { headers: this.getAuthHeaders() });
                    
                    console.log(`  ✅ Created income: ${fireflyTransaction.description}`);
                }
                
                this.stats.income.migrated++;
            } catch (error) {
                console.error(`  ❌ Failed to migrate income ${income.id}: ${error.message}`);
                this.stats.income.errors++;
            }
        }
    }

    // Helper methods
    mapAccountType(customType) {
        const typeMap = {
            'asset': 'asset',
            'expense': 'expense',
            'liability': 'liability',
            'revenue': 'revenue'
        };
        return typeMap[customType?.toLowerCase()] || 'asset';
    }

    formatDate(dateString) {
        if (!dateString) return new Date().toISOString().split('T')[0];
        
        // Handle various date formats
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return new Date().toISOString().split('T')[0];
        }
        return date.toISOString().split('T')[0];
    }

    buildTransactionDescription(transaction, items) {
        if (transaction.shop && items.length > 0) {
            const itemNames = items.slice(0, 3).map(item => item.name).join(', ');
            const extra = items.length > 3 ? ` and ${items.length - 3} more` : '';
            return `${transaction.shop}: ${itemNames}${extra}`;
        }
        return transaction.shop || 'Expense';
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
            notes.push('Items:');
            items.forEach(item => {
                const quantity = item.quantity ? `${item.quantity}x ` : '';
                const price = item.price ? ` (${item.price})` : '';
                notes.push(`- ${quantity}${item.name}${price}`);
            });
        }
        
        return notes.join('\\n');
    }

    buildTransactionTags(transaction, items) {
        const tags = [];
        
        if (transaction.shop) {
            tags.push(transaction.shop.toLowerCase().replace(/\s+/g, '-'));
        }
        
        const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
        tags.push(...categories.map(cat => cat.toLowerCase().replace(/\s+/g, '-')));
        
        return tags.slice(0, 5); // Limit to 5 tags
    }

    async run() {
        try {
            await this.init();
            await this.backupOriginalData();
            
            console.log(`\\n🚀 Starting migration (DRY_RUN: ${this.config.DRY_RUN})...`);
            
            await this.migrateAccounts();
            await this.migrateTransactions();
            await this.migrateIncome();
            
            this.printSummary();
            
        } catch (error) {
            console.error(`❌ Migration failed: ${error.message}`);
            process.exit(1);
        } finally {
            if (this.db) {
                this.db.close();
            }
        }
    }

    printSummary() {
        console.log('\\n📊 Migration Summary:');
        console.log('=====================================');
        console.log(`Accounts: ${this.stats.accounts.migrated}/${this.stats.accounts.total} (${this.stats.accounts.errors} errors)`);
        console.log(`Transactions: ${this.stats.transactions.migrated}/${this.stats.transactions.total} (${this.stats.transactions.errors} errors)`);
        console.log(`Income: ${this.stats.income.migrated}/${this.stats.income.total} (${this.stats.income.errors} errors)`);
        console.log('=====================================');
        
        if (this.config.DRY_RUN) {
            console.log('\\n⚠️  This was a DRY RUN - no data was actually migrated.');
            console.log('   Set DRY_RUN: false to perform actual migration.');
        } else {
            console.log('\\n✅ Migration completed!');
        }
        
        console.log(`\\n💾 Backup saved to: ${this.config.BACKUP_PATH}`);
    }
}

// Usage
if (require.main === module) {
    const migrator = new FireflyMigrator(CONFIG);
    migrator.run().catch(console.error);
}

module.exports = FireflyMigrator;