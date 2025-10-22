const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🎉 Бот запущен! Я работаю!');
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Помощь: /start, /help');
});

bot.on('message', (msg) => {
  if (!msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Эхо: ${msg.text}`);
  }
});

app.listen(8000, () => {
  console.log('Бот запущен!');
});
