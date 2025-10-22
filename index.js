const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
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
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Обработчик ошибок polling
bot.on('polling_error', (error) => {
  console.log('Polling error, but bot continues:', error.message);
});

// База знаний
const knowledgeBase = {
  'привет': 'Привет! Я твой умный помощник! 🤖',
  'как дела': 'Отлично! Работаю над собой! А у тебя?',
  'что ты умеешь': 'Отвечать на вопросы, показывать время, давать советы!',
  'совет': 'Начни с малого - каждый день учи что-то новое! 💪',
  'время': `Сейчас: ${new Date().toLocaleTimeString('ru-RU')}`
};

// Команда /start с кнопками
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['❓ Что ты умеешь', '🕐 Время'],
        ['💡 Совет', '📞 Контакты'],
        ['🎲 Случайный факт']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я твой улучшенный бот! 🚀\nВыбери кнопку или просто напиши вопрос:', 
    options
  );
});

// Обработка кнопок и сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase().trim();

  if (text === '/start') return;

  // Обработка кнопок
  switch(text) {
    case '❓ что ты умеешь':
      bot.sendMessage(chatId, 'Я умею:\n• Отвечать на вопросы\n• Показывать время\n• Давать советы\n• И многое другое!');
      break;
    case '🕐 время':
      bot.sendMessage(chatId, `Точное время: ${new Date().toLocaleString('ru-RU')}`);
      break;
    case '💡 совет':
      const advice = [
        'Никогда не сдавайся!',
        'Каждая проблема - это возможность',
        'Учись на ошибках',
        'Мечтай масштабно!'
      ];
      bot.sendMessage(chatId, `Совет: ${advice[Math.floor(Math.random() * advice.length)]}`);
      break;
    case '📞 контакты':
      bot.sendMessage(chatId, 'Связь с создателем: @chinaski\nПо вопросам создания ботов!');
      break;
    case '🎲 случайный факт':
      const facts = [
        'Коты спят 70% жизни 😴',
        'Мед никогда не портится 🍯', 
        'Телеграм создали в 2013 году',
        'Python назван в честь комедийного шоу 🐍'
      ];
      bot.sendMessage(chatId, `Факт: ${facts[Math.floor(Math.random() * facts.length)]}`);
      break;
    default:
      // Поиск в базе знаний
      const response = knowledgeBase[text] || 
        `Пока не знаю ответ на "${msg.text}". Но я учусь! Попробуй спросить что-то другое или используй кнопки 👆`;
      bot.sendMessage(chatId, response);
  }
});

console.log('Улучшенный бот запущен!');
