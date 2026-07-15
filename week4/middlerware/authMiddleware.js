const authService = require('../services/authService');

// Attach as middleware to any route that should only answer for logged-in
// users. On success it sets req.user; on failure it sends the response
// itself and the route handler never runs.
async function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'authentication required' });
  }

  const user = await authService.getUserFromToken(token);

  if (!user) {
    // Missing, malformed, forged, expired token, or the user no longer exists
    return res.status(401).json({ error: 'authentication required' });
  }

  if (user.disabled) {
    // Identity is known and the token is valid, but the account isn't allowed in
    return res.status(403).json({ error: 'account is disabled' });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
