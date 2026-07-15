const express = require('express');
const router = express.Router();
const notesService = require('../services/notesService');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/notes', requireAuth, async (req, res) => {
  try {
    const note = await notesService.addNote(req.body && req.body.text);
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/notes', async (req, res) => {
  try {
    const notes = await notesService.getNotes();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
