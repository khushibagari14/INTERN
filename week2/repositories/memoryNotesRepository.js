let notes = [];
let nextId = 1;

function create(text) {
  const note = { id: nextId++, text, created_at: new Date().toISOString() };
  notes.push(note);
  return note;
}

function list() {
  return notes;
}

module.exports = { create, list };