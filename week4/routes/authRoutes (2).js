const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const user = await authService.register(username, password);
    res.status(201).json({ message: `user '${user.username}' registered` });
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = await authService.login(username, password);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message });
  }
});

// Demo-only: lets you flip your own account's disabled flag so you can
// see the 403 path on a protected route without touching the DB by hand.
router.post('/me/toggle-disabled', requireAuth, async (req, res) => {
  try {
    const updated = await authService.setDisabled(req.user.username, !req.user.disabled);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
