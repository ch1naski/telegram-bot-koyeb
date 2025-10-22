const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// ВАЖНО: эта строка исправляет ошибки подключения
process.env.NTBA_FIX_319 = 1;

const app = express();
const port = process.env.PORT || 8000;

// Веб-сервер для Koyeb
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Web server is running on port ${port}`);
});

// ===== ТЕЛЕГРАМ БОТ =====
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: {
    interval: 1000,
    params: { timeout: 10 }
  }
});

// Обработчик ошибок polling
bot.on('polling_error', (error) => {
  console.log('Polling error, but bot continues:', error.message);
});

// Команда /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Бот работает! Напиши мне сообщение');
});

// Обработка сообщений
bot.on('message', (msg) => {
  if (msg.text.startsWith('/')) return;
  bot.sendMessage(msg.chat.id, `Вы написали: "${msg.text}"`);
});

console.log('Бот запущен!');
