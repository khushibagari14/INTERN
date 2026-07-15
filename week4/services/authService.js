const crypto = require('crypto');
const repository = require('../repositories/postgresUsersRepository');

// Signing secret for session tokens. Randomly generated at boot — restarting
// the server invalidates old tokens, which is fine for this stage.
const TOKEN_SECRET = crypto.randomBytes(32);
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return { saltHex: salt.toString('hex'), hashHex: hash.toString('hex') };
}

function verifyPassword(password, saltHex, hashHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const attempt = crypto.scryptSync(password, salt, 64);
  return attempt.length === expected.length && crypto.timingSafeEqual(attempt, expected);
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function signToken(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest());
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expectedSig = b64url(crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest());

  const sigBuf = Buffer.from(sig || '');
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8'));
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  return payload;
}

async function register(username, password) {
  if (typeof username !== 'string' || username.trim().length < 3) {
    throw new Error('username must be at least 3 characters');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('password must be at least 8 characters');
  }

  const existing = await repository.findByUsername(username);
  if (existing) {
    const err = new Error('username already exists');
    err.status = 409;
    throw err;
  }

  const { saltHex, hashHex } = hashPassword(password);
  return repository.create(username, hashHex, saltHex);
}

async function login(username, password) {
  const user = await repository.findByUsername(username);
  if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
    const err = new Error('invalid username or password');
    err.status = 401;
    throw err;
  }

  const token = signToken({ username: user.username, exp: Date.now() + TOKEN_TTL_MS });
  return { token, expiresInSeconds: TOKEN_TTL_MS / 1000 };
}

async function getUserFromToken(token) {
  const payload = verifyToken(token);
  if (!payload) return null;
  return repository.findByUsername(payload.username);
}

module.exports = { register, login, getUserFromToken, setDisabled: repository.setDisabled };
