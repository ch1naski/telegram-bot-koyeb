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

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// НАСТОЯЩИЙ ИИ через работающий API
async function askRealAI(question) {
  try {
    console.log('Asking Real AI:', question);
    
    // Вариант 1: Бесплатный OpenAI-совместимый API
    const response = await axios.post(
      'https://api.deepinfra.com/v1/openai/chat/completions',
      {
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('Real AI Response:', response.data);
    
    if (response.data.choices && response.data.choices[0].message.content) {
      return response.data.choices[0].message.content;
    }
    
    throw new Error('No response from AI');
    
  } catch (error) {
    console.log('DeepInfra AI Error:', error.response?.data || error.message);
    
    // Пробуем запасной вариант - другой работающий API
    return tryBackupAI(question);
  }
}

// Запасной работающий API
async function tryBackupAI(question) {
  try {
    console.log('Trying Backup AI...');
    
    // Hugging Face Inference API с работающей моделью
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-xl',
      {
        inputs: question,
        parameters: {
          max_length: 200,
          temperature: 0.9,
          do_sample: true
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
    
    console.log('Backup AI Response:', response.data);
    
    if (response.data && response.data[0] && response.data[0].generated_text) {
      return response.data[0].generated_text;
    }
    
    return '🤖 ИИ временно недоступен. Попробуйте позже.';
    
  } catch (error) {
    console.log('Backup AI also failed:', error.response?.status);
    return '⚠️ Все ИИ сервисы временно недоступны. Разработчик уже уведомлен!';
  }
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🧠 Спросить ИИ', '🌍 Примеры вопросов'],
        ['🕐 Время', '📞 Контакты']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я бот с *НАСТОЯЩИМ ИСКУССТВЕННЫМ ИНТЕЛЛЕКТОМ*! 🧠\n\n' +
    'Задай *ЛЮБОЙ* вопрос - даже тот, которого нет в коде!\n\n' +
    'Примеры:\n' +
    '• "Напиши стихотворение про кота"\n' + 
    '• "Объясни квантовую физику просто"\n' +
    '• "Придумай рецепт ужина"\n' +
    '• "Что такое черные дыры?"\n\n' +
    'Я действительно использую нейросети!', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🧠 Спросить ИИ') {
    bot.sendMessage(chatId, 
      'Задай *ЛЮБОЙ* вопрос! Я использую настоящий ИИ:\n\n' +
      '• Mistral AI (Mixtral 8x7B)\n' +
      '• Google FLAN-T5\n\n' +
      'Можешь спросить о чем угодно - даже если этого нет в коде! 🧠'
    );
  } 
  else if (text === '🌍 Примеры вопросов') {
    bot.sendMessage(chatId, 
      'Примеры *реальных* вопросов для ИИ:\n\n' +
      '🎨 *Творчество:*\n' +
      '• "Напиши короткий рассказ"\n' +
      '• "Придумай название для кафе"\n\n' +
      '🔬 *Наука:*\n' +
      '• "Объясни теорию относительности"\n' +
      '• "Что такое ДНК?"\n\n' +
      '💼 *Практическое:*\n' +
      '• "Составь план тренировок"\n' +
      '• "Дай советы по изучению английского"\n\n' +
      '❓ *Любые другие вопросы!*'
    );
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, `🕐 Точное время: ${new Date().toLocaleString('ru-RU')}`);
  }
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, '👨‍💻 Создатель: @ch0nyatski\n\nБот использует настоящие нейросети!');
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🧠 Нейросеть генерирует ответ...');
    
    const aiResponse = await askRealAI(text);
    
    bot.deleteMessage(chatId, thinkingMsg.message_id);
    bot.sendMessage(chatId, `🤖 *Ответ нейросети:*\n\n${aiResponse}`);
  }
});

console.log('Бот с НАСТОЯЩИМ ИИ запущен!');
