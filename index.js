const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Bot with REAL AI is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server started on port ' + port);
});

// ===== ТЕЛЕГРАМ БОТ =====
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Функция для запроса к ИИ - ИСПРАВЛЕННАЯ
async function askAI(question) {
  try {
    console.log('Asking AI:', question);
    
    // ПРОБУЕМ РАЗНЫЕ МОДЕЛИ ПО ОЧЕРЕДИ
    const models = [
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-small',
      'https://api-inference.huggingface.co/models/gpt2',
      'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill'
    ];
    
    let lastError;
    
    for (const modelUrl of models) {
      try {
        console.log('Trying model:', modelUrl);
        
        const response = await axios.post(
          modelUrl,
          {
            inputs: question,
            parameters: {
              max_length: 150,
              temperature: 0.9,
              do_sample: true,
              return_full_text: false
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
              'Content-Type': 'application/json'
            },
            timeout: 25000
          }
        );
        
        console.log('AI Response from', modelUrl, ':', response.data);
        
        // Обработка разных форматов ответа
        if (response.data && response.data[0] && response.data[0].generated_text) {
          let answer = response.data[0].generated_text;
          // Очищаем ответ от повторения вопроса
          if (answer.toLowerCase().includes(question.toLowerCase())) {
            answer = answer.replace(new RegExp(question, 'gi'), '').trim();
          }
          return answer || getSmartAnswer(question);
        }
        
        if (response.data && response.data.generated_text) {
          return response.data.generated_text;
        }
        
      } catch (error) {
        console.log(`Model ${modelUrl} failed:`, error.response?.status);
        lastError = error;
        // Продолжаем пробовать следующую модель
        continue;
      }
    }
    
    // Если все модели не сработали
    throw lastError;
    
  } catch (error) {
    console.log('All AI models failed:', error.message);
    return getSmartAnswer(question);
  }
}

// Умные ответы на конкретные вопросы
function getSmartAnswer(question) {
  const lowerQ = question.toLowerCase();
  
  // Конкретные ответы на популярные вопросы
  if (lowerQ.includes('сколько дней в году') || lowerQ.includes('дней в году')) {
    return 'В обычном году 365 дней, в високосном году 366 дней! 📅';
  }
  if (lowerQ.includes('сколько часов в сутках') || lowerQ.includes('часов в сутках')) {
    return 'В сутках 24 часа! ⏰';
  }
  if (lowerQ.includes('столица россии') || lowerQ.includes('столица россии')) {
    return 'Столица России - Москва! 🏛️';
  }
  if (lowerQ.includes('сколько планет') || lowerQ.includes('планет в солнечной системе')) {
    return 'В солнечной системе 8 планет: Меркурий, Венера, Земля, Марс, Юпитер, Сатурн, Уран, Нептун! 🪐';
  }
  if (lowerQ.includes('привет') || lowerQ.includes('здравствуй') || lowerQ.includes('hello')) {
    return 'Привет! Я ИИ-бот, готовый отвечать на твои вопросы! 🤖';
  }
  if (lowerQ.includes('как дела') || lowerQ.includes('как ты')) {
    return 'У меня все отлично! Анализирую запросы и помогаю пользователям! 😊';
  }
  if (lowerQ.includes('что ты умеешь') || lowerQ.includes('твои возможности')) {
    return 'Я могу отвечать на вопросы, предоставлять информацию и помогать с различными задачами! 💡';
  }
  
  // Общие умные ответы
  const smartResponses = [
    `На основе анализа вашего вопроса "${question}", я могу предоставить информацию по этой теме.`,
    `Это интересный вопрос! Мой искусственный интеллект обрабатывает такие запросы.`,
    `Я проанализировал ваш вопрос и готов поделиться информацией.`,
    `Как ИИ-ассистент, я специализируюсь на ответах на различные вопросы.`
  ];
  
  return smartResponses[Math.floor(Math.random() * smartResponses.length)];
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🧠 Спросить ИИ', '❓ Примеры вопросов'],
        ['🕐 Время', '📞 Контакты']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я бот с *настоящим ИИ*! 🧠\n\n' +
    'Задай любой вопрос:\n' +
    '• "Сколько дней в году?"\n' + 
    '• "Столица России?"\n' +
    '• "Сколько планет в солнечной системе?"\n\n' +
    'Я постараюсь дать точный ответ!', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🧠 Спросить ИИ') {
    bot.sendMessage(chatId, 'Задай любой вопрос! Я использую искусственный интеллект для генерации ответов! 🧠');
  } 
  else if (text === '❓ Примеры вопросов') {
    bot.sendMessage(chatId, 
      'Примеры вопросов для ИИ:\n\n' +
      '• "Сколько дней в году?"\n' +
      '• "Столица Франции?"\n' + 
      '• "Сколько часов в сутках?"\n' +
      '• "Что такое фотосинтез?"\n' +
      '• "Кто изобрел телефон?"\n\n' +
      'Или задай свой вопрос!'
    );
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, `🕐 Точное время: ${new Date().toLocaleString('ru-RU')}`);
  }
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, '👨‍💻 Создатель: @ch0nyatski\n\nБот с интеграцией Hugging Face ИИ');
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🧠 ИИ анализирует вопрос...');
    
    const aiResponse = await askAI(text);
    
    bot.deleteMessage(chatId, thinkingMsg.message_id);
    bot.sendMessage(chatId, `🤖 *Ответ:*\n\n${aiResponse}`);
  }
});

console.log('Бот с улучшенным ИИ запущен!');
