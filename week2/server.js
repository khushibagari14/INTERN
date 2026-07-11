require('dotenv').config();
const express = require('express');
const notesRoutes = require('./routes/notesRoutes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello! This is my first API.' });
});

app.get('/status', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use(notesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});