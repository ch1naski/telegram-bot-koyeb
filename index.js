const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Bot with AI is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server started on port ' + port);
});

// ===== ТЕЛЕГРАМ БОТ =====
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ОТЛАДОЧНЫЕ СООБЩЕНИЯ
console.log('Bot token exists:', !!token);
console.log('Bot initialized');

bot.on('polling_error', (error) => {
  console.log('Polling error:', error.message);
});

// Простая функция для теста
function quickAIResponse(question) {
  return `🤖 Я получил ваш вопрос: "${question}"\n\nЭто тестовый ответ от ИИ! Работаю над интеграцией настоящей нейросети... 🧠`;
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  console.log('/start command received from:', msg.chat.id);
  const chatId = msg.chat.id;
  
  const options = {
    reply_markup: {
      keyboard: [
        ['🧠 Тест ИИ', '📞 Контакты'],
        ['🕐 Время', 'ℹ️ Статус']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я бот в режиме отладки 🛠️\n\n' +
    'Нажми "🧠 Тест ИИ" чтобы проверить работу', 
    options
  );
});

// Обработка ВСЕХ сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log('Message received:', { chatId, text });

  if (!text) return;

  // Игнорируем команды кроме /start
  if (text.startsWith('/') && text !== '/start') return;

  if (text === '🧠 Тест ИИ') {
    console.log('Test AI button pressed');
    bot.sendMessage(chatId, 'Напиши любой вопрос для теста ИИ!');
  } 
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, 'Создатель: @ch0nyatski');
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, `Время: ${new Date().toLocaleString('ru-RU')}`);
  }
  else if (text === 'ℹ️ Статус') {
    bot.sendMessage(chatId, '🤖 Бот активен\n🛠️ Режим отладки\n🧠 ИИ в разработке');
  }
  else {
    console.log('Processing question:', text);
    const
