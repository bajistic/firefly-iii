const mysql = require('mysql2/promise');
require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Database environment variables DB_USER, DB_PASSWORD, and DB_NAME must be set');
  process.exit(1);
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Execute a SQL statement (INSERT/UPDATE/DELETE), returning last insert ID and affected rows.
 * @param {string} sql
 * @param {Array<any>} params
 */
async function dbRunAsync(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return { lastID: result.insertId, changes: result.affectedRows };
}

/**
 * Execute a SQL query, returning all rows.
 * @param {string} sql
 * @param {Array<any>} params
 */
async function dbAllAsync(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { pool, dbRunAsync, dbAllAsync };