const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Bot with AI is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server started on port ' + port);
});

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Функция для запроса к Hugging Face
async function askAI(question) {
  try {
    console.log('Asking AI:', question);
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
      {
        inputs: question,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          do_sample: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );

    console.log('AI Response:', response.data);

    if (response.data && response.data[0] && response.data[0].generated_text) {
      let answer = response.data[0].generated_text;
      if (answer.includes(question)) {
        answer = answer.replace(question, '').trim();
      }
      return answer;
    } else {
      return '🤖 ИИ обработал запрос, но ответ имеет неожиданный формат.';
    }
  } catch (error) {
    console.log('Hugging Face Error:', error.response?.data || error.message);
    
    if (error.response?.status === 503) {
      const estimatedTime = error.response.data.estimated_time;
      console.log(`Model is loading. Estimated time: ${estimatedTime} seconds.`);
      return `⚠️ Модель загружается... Подожди ${estimatedTime || 30} секунд и попробуй снова.`;
    }
    
    return '⚠️ Не удалось получить ответ от ИИ. Попробуй спросить что-то другое.';
  }
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🧠 Спросить ИИ', '📞 Контакты'],
        ['🕐 Время', 'ℹ️ О боте']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я бот с *настоящим ИИ*! 🧠\n\n' +
    'Задай *ЛЮБОЙ* вопрос - я использую нейросеть TinyLlama для генерации ответов!\n\n' +
    'Примеры:\n' +
    '• "Объясни квантовую физику"\n' + 
    '• "Напиши стих про кота"\n' +
    '• "Что такое черные дыры?"\n\n' +
    'Первый запрос может занять до 30 секунд!', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🧠 Спросить ИИ') {
    bot.sendMessage(chatId, 'Напиши любой вопрос! Я использую нейросеть TinyLlama для генерации ответов! 🧠\n\n*Первый запрос может занять до 30 секунд*');
  } 
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, '👨‍💻 Создатель: @ch0nyatski\n\nБот с интеграцией Hugging Face ИИ');
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, `🕐 Точное время: ${new Date().toLocaleString('ru-RU')}`);
  }
  else if (text === 'ℹ️ О боте') {
    bot.sendMessage(chatId, 
      '🤖 *О боте:*\n\n' +
      '• *Модель ИИ:* TinyLlama 1.1B\n' +
      '• *Платформа:* Hugging Face\n' + 
      '• *Технологии:* Node.js + Express\n' +
      '• *Хостинг:* Koyeb\n\n' +
      'Этот бот использует настоящую нейросеть!'
    );
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🧠 Нейросеть генерирует ответ...\n*Это может занять до 30 секунд*');
    
    try {
      const aiResponse = await askAI(text);
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, `🤖 *Ответ ИИ:*\n\n${aiResponse}`);
    } catch (error) {
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, '❌ Произошла ошибка при обращении к ИИ. Попробуйте позже.');
    }
  }
});

console.log('Бот с TinyLlama ИИ запущен!');
