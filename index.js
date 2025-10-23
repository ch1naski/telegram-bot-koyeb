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

// Улучшенная функция с таймаутами
async function askAI(question) {
  try {
    console.log('Asking AI:', question);
    
    // Создаем промис с таймаутом
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 25000);
    });
    
    // Запрос к ИИ
    const aiPromise = axios.post(
      'https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
      {
        inputs: question,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          do_sample: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Ждем либо ответ, либо таймаут
    const response = await Promise.race([aiPromise, timeoutPromise]);
    console.log('AI Response received');

    if (response.data && response.data[0] && response.data[0].generated_text) {
      let answer = response.data[0].generated_text;
      if (answer.includes(question)) {
        answer = answer.replace(question, '').trim();
      }
      return answer || '🤖 ИИ сгенерировал ответ, но он пустой.';
    } else {
      return '🤖 ИИ обработал запрос, но не смог сгенерировать текст.';
    }
    
  } catch (error) {
    console.log('AI Error:', error.message, error.response?.status);
    
    if (error.message === 'Timeout') {
      return '⏰ ИИ не ответил за 25 секунд. Модель может быть перегружена. Попробуй позже.';
    }
    
    if (error.response?.status === 503) {
      return '🔧 Модель загружается. Попробуй через 1-2 минуты.';
    }
    
    if (error.response?.status === 404) {
      return '❌ Модель не найдена. Используем запасной вариант.';
    }
    
    return '⚠️ Ошибка соединения с ИИ. Попробуй другой вопрос.';
  }
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🧠 Спросить ИИ', '📞 Контакты'],
        ['🕐 Время', 'ℹ️ Статус']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я бот с ИИ! 🧠\n\n' +
    'Задай вопрос - я попробую получить ответ от нейросети.\n\n' +
    '*Внимание:* ИИ может быть медленным или недоступным на бесплатном хостинге.', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🧠 Спросить ИИ') {
    bot.sendMessage(chatId, 'Напиши вопрос! Пробую подключиться к нейросети... 🧠');
  } 
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, 'Создатель: @ch0nyatski');
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, `Время: ${new Date().toLocaleString('ru-RU')}`);
  }
  else if (text === 'ℹ️ Статус') {
    bot.sendMessage(chatId, '🤖 Бот активен\n🧠 ИИ: пробуем подключиться\n⚡ Скорость: зависит от нагрузки');
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🧠 Пробую подключиться к ИИ...');
    
    try {
      const aiResponse = await askAI(text);
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, `🤖 *Результат:*\n\n${aiResponse}`);
    } catch (error) {
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, '❌ Критическая ошибка. Попробуй перезапустить бота командой /start');
    }
  }
});

console.log('Бот с улучшенными таймаутами запущен!');
