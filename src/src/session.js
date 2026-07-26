const sessions = new Map();
let idCounter = 1;

function getSession(chatId) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { shapes: [], history: [] });
  }
  return sessions.get(chatId);
}

function pushHistory(session) {
  session.history.push(JSON.stringify(session.shapes));
  if (session.history.length > 20) session.history.shift();
}

function undo(session) {
  if (session.history.length === 0) return false;
  session.shapes = JSON.parse(session.history.pop());
  return true;
}

function clear(session) {
  pushHistory(session);
  session.shapes = [];
}

function nextId() {
  return `s${idCounter++}`;
}

module.exports = { getSession, pushHistory, undo, clear, nextId };
