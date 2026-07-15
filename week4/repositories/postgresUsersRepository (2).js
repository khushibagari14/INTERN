const pool = require('../db/pool');

async function findByUsername(username) {
  const result = await pool.query(
    'SELECT id, username, password_hash, password_salt, disabled FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
}

async function create(username, passwordHash, passwordSalt) {
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, password_salt)
     VALUES ($1, $2, $3)
     RETURNING id, username, disabled, created_at`,
    [username, passwordHash, passwordSalt]
  );
  return result.rows[0];
}

async function setDisabled(username, disabled) {
  const result = await pool.query(
    `UPDATE users SET disabled = $2 WHERE username = $1
     RETURNING id, username, disabled`,
    [username, disabled]
  );
  return result.rows[0] || null;
}

module.exports = { findByUsername, create, setDisabled };
