const repository = require('../repositories/postgresNotesRepository');

async function addNote(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('text is required');
  }
  return repository.create(text.trim());
}

async function getNotes() {
  return repository.list();
}

module.exports = { addNote, getNotes };