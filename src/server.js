require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { handleCommand } = require('./commands');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL;

if (!TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in environment variables.');
  process.exit(1);
}

const app = express();
app.use(express.json());

const bot = new TelegramBot(TOKEN, { polling: !PUBLIC_URL });

app.get('/', (req, res) => res.send('Figma FlowBot is running.'));

if (PUBLIC_URL) {
  const webhookPath = `/webhook/${TOKEN}`;
  bot.setWebHook(`${PUBLIC_URL}${webhookPath}`);
  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  console.log('Running in webhook mode.');
} else {
  console.log('Running in polling mode (set PUBLIC_URL for webhook mode on Railway).');
}

bot.on('message', (msg) => {
  if (msg.text && msg.text.startsWith('/')) {
    handleCommand(bot, msg).catch((err) => {
      console.error(err);
      bot.sendMessage(msg.chat.id, 'Something went wrong processing that command.');
    });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
