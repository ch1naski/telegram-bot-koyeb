const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

// Веб-сервер для Koyeb health checks
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Запускаем веб-сервер
app.listen(port, '0.0.0.0', () => {
  console.log(`Web server is running on port ${port}`);
});

// ===== КОД ТЕЛЕГРАМ БОТА =====
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

// Команда /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🎉 Бот запущен! Я работаю на Koyeb!');
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Помощь: /start, /help');
});

// Обработка обычных сообщений
bot.on('message', (msg) => {
  if (!msg.text.startsWith('/')) {
    bot.sendMessage(msg.chat.id, `Эхо: ${msg.text}`);
  }
});

console.log('Бот запущен!');
