/**
 * Firefly III Sync Layer
 * 
 * Automatically syncs transactions between your original MariaDB 
 * and Firefly III while keeping the AI assistant interface minimal.
 */

const mysql = require('mysql2/promise');
const axios = require('axios');

class FireflySync {
    constructor() {
        this.config = {
            // Your original database
            originalDB: {
                host: '192.168.1.100',
                port: 3306,
                user: 'bayarbileg',
                password: 'budagch1n',
                database: 'finance'
            },
            
            // Firefly III API
            firefly: {
                url: 'http://localhost:3001',
                token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiYmIzMjJhYzVlZTU4ZjZjYTE1ZTI2ZDEzMGM2OGZlMDYzNGNjNGIyMTdlNjcyZDRkN2Y1NGRmNWU4Nzg5MTMwNDczOGQ1MWUxMmU5OTA2NmMiLCJpYXQiOjE3NTAxNTE5MTguNDc5MTYzLCJuYmYiOjE3NTAxNTE5MTguNDc5MTY3LCJleHAiOjE3ODE2ODc5MTguMzc3MjcsInN1YiI6IjEiLCJzY29wZXMiOltdfQ.l_OdYgGy4jmd2Em6MG94xuGVAGXffVCLi9lRJRPcQegBq69EoQfoAvnuZS_SHDQRleaywUBXgJK3wdbwd2ItLrczaZZHVVO2P8BHhHt-2yq1xnegUksKEqnxwQetINpEgSNh6rdOz31YEJGQMQwIDWp8qKXvlGSeyBmJdwrE_xobNAselxQ4ASnn9TuSYW6YiYaCHZgZDIOJfTC6UvKlRZS6jRjEw_Nm508f2sQj8jPQh1vt1vjX572aVJRrIGGMAjzx35SD_kioYbVhCXQcnpduXnVYG_YXXSOXX_NrWBgMKWaZryYu9Vjsat37__XIE-ZJuRM--trj9OZ02ydhDZsP69e77Url_iAtOlUaTYk8ZJZiGpEKl2TwLhJy513lEVortw_5EpeP-Cr24P9yC1Q0nV4oAY0ezBFVYVOgn8DWUJWGfh0_htgjMuPHbaggRqoSyCy3plkBMplT15B9VuMbD5kV-xTm_aM0vz5MjyxMKMArdxKCdAsbrrCFfGCOkklgDiI6d88whu_O7tfl_tCV7li-dogEr0zkoB1MK1k1i3xWNWwAY5KrIMPQs-W-0GB4apwp0NiqDSgDRy7giX6eOPeI9inB9c0qwYHNodpY5tTUljsy-I8QNEfoGs0GKZmxCWvg4BTPNuwSXr-yqelgxavtOcDDjpR1EwTosDw'
            },
            
            // Account mapping cache
            accountMapping: new Map([
                ['CHF', 6], // Main Checking Account
                ['EUR', 7], // EUR Account 
                ['USD', 8]  // USD Account
            ])
        };
        
        this.connection = null;
    }

    async init() {
        this.connection = await mysql.createConnection(this.config.originalDB);
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.config.firefly.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.api+json'
        };
    }

    /**
     * Create transaction in both databases
     * Minimal interface: just pass the AI assistant's extracted data
     */
    async createTransaction({ shop, total, currency, items = [], description = '', receiptPath = '' }) {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().split(' ')[0];
        
        try {
            // 1. Insert into original MariaDB
            const [result] = await this.connection.execute(`
                INSERT INTO transactions (shop, date, time, total, currency, description, receipt_path, account_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [shop, date, time, total, currency, description, receiptPath, 1]);
            
            const transactionId = result.insertId;
            
            // 2. Insert items into original DB
            for (const item of items) {
                await this.connection.execute(`
                    INSERT INTO items (transaction_id, name, quantity, price, category)
                    VALUES (?, ?, ?, ?, ?)
                `, [transactionId, item.name, item.quantity || 1, item.price || 0, item.category || '']);
            }
            
            // 3. Create in Firefly III
            const fireflyTransaction = {
                type: 'withdrawal',
                description: shop + (description ? ` - ${description}` : ''),
                amount: Math.abs(total).toString(),
                date: date,
                source_id: this.config.accountMapping.get(currency),
                destination_name: shop,
                currency_code: currency,
                category_name: items.length > 0 ? items[0].category : undefined,
                notes: this.buildNotes(items, receiptPath),
                tags: this.buildTags(shop, items, currency)
            };

            const payload = {
                group_title: fireflyTransaction.description,
                transactions: [fireflyTransaction]
            };

            const response = await axios.post(`${this.config.firefly.url}/api/v1/transactions`, payload, {
                headers: this.getAuthHeaders()
            });

            // 4. Update original DB with Firefly ID for future reference
            await this.connection.execute(`
                UPDATE transactions SET firefly_id = ? WHERE id = ?
            `, [response.data.data.id, transactionId]);

            return {
                success: true,
                originalId: transactionId,
                fireflyId: response.data.data.id,
                description: fireflyTransaction.description
            };

        } catch (error) {
            console.error('Sync error:', error.message);
            throw error;
        }
    }

    /**
     * Create income entry in both databases
     */
    async createIncome({ type, amount, description = '', date = null }) {
        date = date || new Date().toISOString().split('T')[0];
        
        try {
            // 1. Insert into original MariaDB
            const [result] = await this.connection.execute(`
                INSERT INTO income (type, amount, date, description, account_id)
                VALUES (?, ?, ?, ?, ?)
            `, [type, amount, date, description, 1]);
            
            const incomeId = result.insertId;
            
            // 2. Create in Firefly III
            const fireflyTransaction = {
                type: 'deposit',
                description: description || `${type} income`,
                amount: Math.abs(amount).toString(),
                date: date,
                source_name: type,
                destination_id: this.config.accountMapping.get('CHF'), // Default to CHF account
                currency_code: 'CHF',
                category_name: 'Income'
            };

            const payload = {
                group_title: fireflyTransaction.description,
                transactions: [fireflyTransaction]
            };

            const response = await axios.post(`${this.config.firefly.url}/api/v1/transactions`, payload, {
                headers: this.getAuthHeaders()
            });

            // 3. Update original DB with Firefly ID
            await this.connection.execute(`
                UPDATE income SET firefly_id = ? WHERE id = ?
            `, [response.data.data.id, incomeId]);

            return {
                success: true,
                originalId: incomeId,
                fireflyId: response.data.data.id,
                description: fireflyTransaction.description
            };

        } catch (error) {
            console.error('Income sync error:', error.message);
            throw error;
        }
    }

    /**
     * Helper methods
     */
    buildNotes(items, receiptPath) {
        const notes = [];
        
        if (receiptPath) {
            notes.push(`Receipt: ${receiptPath}`);
        }
        
        if (items.length > 0) {
            notes.push('\\nItems purchased:');
            items.forEach(item => {
                const quantity = item.quantity ? `${item.quantity}x ` : '';
                const price = item.price ? ` - ${item.price}` : '';
                const category = item.category ? ` [${item.category}]` : '';
                notes.push(`• ${quantity}${item.name}${price}${category}`);
            });
        }
        
        return notes.join('\\n');
    }

    buildTags(shop, items, currency) {
        const tags = [];
        
        if (shop) {
            tags.push(shop.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        }
        
        const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
        tags.push(...categories.map(cat => cat.toLowerCase().replace(/[^a-z0-9]/g, '-')));
        
        tags.push(currency.toLowerCase());
        
        return [...new Set(tags)].slice(0, 5);
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
        }
    }
}

module.exports = FireflySync;