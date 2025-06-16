#!/usr/bin/env node
/**
 * Migration script for MariaDB: adds missing columns (discount) to tables.
 * Usage: node src/migrate-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Error: DB_USER, DB_PASSWORD, and DB_NAME must be set in .env');
  process.exit(1);
}

(async () => {
  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
  try {
    console.log(`Connected to MariaDB ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    // Check and add 'discount' column to 'transactions'
    const [transCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'transactions' AND column_name = 'discount'`,
      [DB_NAME]
    );
    if (transCols.length === 0) {
      console.log("Adding 'discount' column to 'transactions' table...");
      await pool.execute("ALTER TABLE transactions ADD COLUMN discount DOUBLE NULL");
      console.log("Added 'discount' column to 'transactions'.");
    } else {
      console.log("'transactions.discount' already exists. Skipping.");
    }

    // Check and add 'discount' column to 'items'
    const [itemCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'items' AND column_name = 'discount'`,
      [DB_NAME]
    );
    if (itemCols.length === 0) {
      console.log("Adding 'discount' column to 'items' table...");
      await pool.execute("ALTER TABLE items ADD COLUMN discount DOUBLE NULL");
      console.log("Added 'discount' column to 'items'.");
    } else {
      console.log("'items.discount' already exists. Skipping.");
    }
    // Check and create 'jobs' table
    const [jobTables] = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'jobs'`,
      [DB_NAME]
    );
    if (jobTables.length === 0) {
      console.log("Creating 'jobs' table...");
      await pool.execute(`
        CREATE TABLE jobs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          source_url VARCHAR(2048) NOT NULL,
          job_title VARCHAR(255) NOT NULL,
          pensum VARCHAR(50) NOT NULL,
          company VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL
        )
      `);
      console.log("'jobs' table created.");
    } else {
      console.log("'jobs' table already exists. Skipping.");
    }
    // Check and add 'favorite' column to 'jobs' table
    const [favCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'jobs' AND column_name = 'favorite'`,
      [DB_NAME]
    );
    if (favCols.length === 0) {
      console.log("Adding 'favorite' column to 'jobs' table...");
      await pool.execute("ALTER TABLE jobs ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT FALSE");
      console.log("Added 'favorite' column to 'jobs'.");
    } else {
      console.log("'jobs.favorite' already exists. Skipping.");
    }
    // Check and add 'description' column to 'jobs' table for storing scraped job ad content
    const [descCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'jobs' AND column_name = 'description'`,
      [DB_NAME]
    );
    if (descCols.length === 0) {
      console.log("Adding 'description' column to 'jobs' table...");
      await pool.execute("ALTER TABLE jobs ADD COLUMN description TEXT NULL");
      console.log("Added 'description' column to 'jobs'.");
    } else {
      console.log("'jobs.description' already exists. Skipping.");
    }

    // Check and update 'currency' column enum type to include USD
    const [currencyCols] = await pool.query(
      `SELECT COLUMN_TYPE FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'transactions' AND column_name = 'currency'`,
      [DB_NAME]
    );
    if (currencyCols.length > 0) {
      const colType = currencyCols[0].COLUMN_TYPE;
      if (!colType.includes("'USD'")) {
        console.log("Altering 'currency' column in 'transactions' to support USD...");
        await pool.execute(
          "ALTER TABLE transactions MODIFY COLUMN currency ENUM('EUR','CHF','USD') NOT NULL DEFAULT 'CHF'"
        );
        console.log("Updated 'currency' column to include USD.");
      } else {
        console.log("'transactions.currency' already supports USD. Skipping.");
      }
    } else {
      console.log("'transactions.currency' column not found. Skipping USD migration.");
    }
    // Add 'firefly_id' columns for two-way sync with Firefly III
    // transactions.firefly_id
    const [txFireflyCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'transactions' AND column_name = 'firefly_id'`,
      [DB_NAME]
    );
    if (txFireflyCols.length === 0) {
      console.log("Adding 'firefly_id' column to 'transactions' table...");
      await pool.execute("ALTER TABLE transactions ADD COLUMN firefly_id VARCHAR(255) NULL");
      console.log("Added 'firefly_id' to 'transactions'.");
    } else {
      console.log("'transactions.firefly_id' already exists. Skipping.");
    }
    // items.firefly_id (for split IDs)
    const [itemFireflyCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'items' AND column_name = 'firefly_id'`,
      [DB_NAME]
    );
    if (itemFireflyCols.length === 0) {
      console.log("Adding 'firefly_id' column to 'items' table...");
      await pool.execute("ALTER TABLE items ADD COLUMN firefly_id VARCHAR(255) NULL");
      console.log("Added 'firefly_id' to 'items'.");
    } else {
      console.log("'items.firefly_id' already exists. Skipping.");
    }
    // accounts.firefly_id
    const [acctFireflyCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'accounts' AND column_name = 'firefly_id'`,
      [DB_NAME]
    );
    if (acctFireflyCols.length === 0) {
      console.log("Adding 'firefly_id' column to 'accounts' table...");
      await pool.execute("ALTER TABLE accounts ADD COLUMN firefly_id VARCHAR(255) NULL");
      console.log("Added 'firefly_id' to 'accounts'.");
    } else {
      console.log("'accounts.firefly_id' already exists. Skipping.");
    }
    // income.firefly_id
    const [incFireflyCols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'income' AND column_name = 'firefly_id'`,
      [DB_NAME]
    );
    if (incFireflyCols.length === 0) {
      console.log("Adding 'firefly_id' column to 'income' table...");
      await pool.execute("ALTER TABLE income ADD COLUMN firefly_id VARCHAR(255) NULL");
      console.log("Added 'firefly_id' to 'income'.");
    } else {
      console.log("'income.firefly_id' already exists. Skipping.");
    }
    // Create 'categories' table to map local names to Firefly category IDs
    const [catTables] = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = ? AND table_name = 'categories'`,
      [DB_NAME]
    );
    if (catTables.length === 0) {
      console.log("Creating 'categories' table for Firefly sync...");
      await pool.execute(`
        CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          firefly_id VARCHAR(255) NOT NULL
        )
      `);
      console.log("'categories' table created.");
    } else {
      console.log("'categories' table already exists. Skipping.");
    }
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();