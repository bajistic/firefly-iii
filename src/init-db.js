const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'expenses.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop TEXT,
      date TEXT NOT NULL,
      time TEXT,
      total REAL,
      currency TEXT CHECK(currency IN ('EUR', 'CHF')) DEFAULT 'CHF',
      discount REAL,
      receipt_path TEXT,
      account_id INTEGER,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER,
      price REAL,
      category TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      account_id INTEGER,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0.0
    )
  `);
});

db.close();
