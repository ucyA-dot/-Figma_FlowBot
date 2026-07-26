const { getSession, pushHistory, undo, clear, nextId } = require('./session');
const { renderScene, CANVAS_WIDTH, CANVAS_HEIGHT } = require('./canvasEngine');

function parseArgs(parts) {
  const args = {};
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    if (rest.length) args[key] = rest.join('=').replace(/^"|"$/g, '');
  }
  return args;
}

const HELP_TEXT = `*Figma FlowBot* — a simple design canvas over chat

/new — start a fresh canvas
/add rect x=50 y=50 w=100 h=80 color=red
/add circle x=200 y=100 r=40 color=blue
/add text x=10 y=10 content="Hello" size=20 color=black
/add line x=0 y=0 x2=100 y2=100 color=black
/move <id> x=.. y=..
/resize <id> w=.. h=.. (or r=.. for circles)
/color <id> <color>
/delete <id>
/list — list all shapes with ids
/undo — undo last change
/clear — clear canvas
/export — send current canvas as PNG

Canvas size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`;

async function handleCommand(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const [cmd, ...rest] = text.split(/\s+/);
  const session = getSession(chatId);

  switch (cmd) {
    case '/start':
    case '/help':
      return bot.sendMessage(chatId, HELP_TEXT, { parse_mode: 'Markdown' });

    case '/new':
      pushHistory(session);
      session.shapes = [];
      return bot.sendMessage(chatId, 'New canvas started. Use /add to draw shapes.');

    case '/add': {
      const type = rest[0];
      const args = parseArgs(rest.slice(1));
      const shape = { id: nextId(), type, color: args.color };

      if (type === 'rect') {
        Object.assign(shape, { x: +args.x || 0, y: +args.y || 0, w: +args.w || 50, h: +args.h || 50 });
      } else if (type === 'circle') {
        Object.assign(shape, { x: +args.x || 0, y: +args.y || 0, r: +args.r || 30 });
      } else if (type === 'text') {
        Object.assign(shape, { x: +args.x || 0, y: +args.y || 0, content: args.content || 'Text', size: +args.size || 20 });
      } else if (type === 'line') {
        Object.assign(shape, { x: +args.x || 0, y: +args.y || 0, x2: +args.x2 || 100, y2: +args.y2 || 100 });
      } else {
        return bot.sendMessage(chatId, 'Unknown shape type. Use rect, circle, text, or line.');
      }

      pushHistory(session);
      session.shapes.push(shape);
      return renderAndSend(bot, chatId, session, `Added ${type} \`${shape.id}\``);
    }

    case '/move': {
      const [id, ...argParts] = rest;
      const args = parseArgs(argParts);
      const shape = session.shapes.find((s) => s.id === id);
      if (!shape) return bot.sendMessage(chatId, `No shape with id ${id}`);
      pushHistory(session);
      if (args.x !== undefined) shape.x = +args.x;
      if (args.y !== undefined) shape.y = +args.y;
      return renderAndSend(bot, chatId, session, `Moved \`${id}\``);
    }

    case '/resize': {
      const [id, ...argParts] = rest;
      const args = parseArgs(argParts);
      const shape = session.shapes.find((s) => s.id === id);
      if (!shape) return bot.sendMessage(chatId, `No shape with id ${id}`);
      pushHistory(session);
      if (args.w !== undefined) shape.w = +args.w;
      if (args.h !== undefined) shape.h = +args.h;
      if (args.r !== undefined) shape.r = +args.r;
      return renderAndSend(bot, chatId, session, `Resized \`${id}\``);
    }

    case '/color': {
      const [id, color] = rest;
      const shape = session.shapes.find((s) => s.id === id);
      if (!shape) return bot.sendMessage(chatId, `No shape with id ${id}`);
      pushHistory(session);
      shape.color = color;
      return renderAndSend(bot, chatId, session, `Recolored \`${id}\``);
    }

    case '/delete': {
      const [id] = rest;
      const before = session.shapes.length;
      pushHistory(session);
      session.shapes = session.shapes.filter((s) => s.id !== id);
      if (session.shapes.length === before) return bot.sendMessage(chatId, `No shape with id ${id}`);
      return renderAndSend(bot, chatId, session, `Deleted \`${id}\``);
    }

    case '/list': {
      if (!session.shapes.length) return bot.sendMessage(chatId, 'Canvas is empty. Use /add to draw something.');
      const lines = session.shapes.map((s) => `\`${s.id}\` — ${s.type} @ (${s.x}, ${s.y})`);
      return bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
    }

    case '/undo': {
      const ok = undo(session);
      return ok
        ? renderAndSend(bot, chatId, session, 'Undid last change')
        : bot.sendMessage(chatId, 'Nothing to undo.');
    }

    case '/clear':
      clear(session);
      return bot.sendMessage(chatId, 'Canvas cleared.');

    case '/export':
      return renderAndSend(bot, chatId, session, 'Current canvas:');

    default:
      return bot.sendMessage(chatId, 'Unknown command. Send /help to see what I can do.');
  }
}

async function renderAndSend(bot, chatId, session, caption) {
  const buffer = renderScene(session);
  return bot.sendPhoto(chatId, buffer, { caption });
}

module.exports = { handleCommand };
