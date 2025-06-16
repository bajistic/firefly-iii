const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'expenses.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Add currency column to transactions table (TEXT, nullable, default CHF)
  db.run(`
    ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'CHF'
  `, (err) => {
    if (err) {
      console.error('Error adding currency column:', err.message);
    } else {
      console.log('Added currency column to transactions table');
    }
  });
});

db.close();
