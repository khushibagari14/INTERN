const pool = require('../db/pool');

async function create(text) {
  const result = await pool.query(
    'INSERT INTO notes (text) VALUES ($1) RETURNING id, text, created_at',
    [text]
  );
  return result.rows[0];
}

async function list() {
  const result = await pool.query(
    'SELECT id, text, created_at FROM notes ORDER BY id ASC'
  );
  return result.rows;
}

module.exports = { create, list };
