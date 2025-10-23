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

// Функция, которая пробует разные модели
async function askAI(question) {
  const models = [
    {
      name: 'Facebook Blenderbot',
      url: 'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill',
      format: 'blenderbot'
    },
    {
      name: 'Google T5', 
      url: 'https://api-inference.huggingface.co/models/google/flan-t5-large',
      format: 't5'
    },
    {
      name: 'Microsoft DialoGPT',
      url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-small', 
      format: 'dialogpt'
    }
  ];

  for (const model of models) {
    try {
      console.log(`Trying model: ${model.name}`);
      
      const response = await axios.post(
        model.url,
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
          },
          timeout: 20000
        }
      );

      console.log(`${model.name} response:`, response.data);

      // Обработка разных форматов ответов
      if (model.format === 'blenderbot' && response.data && response.data.generated_text) {
        return response.data.generated_text;
      }
      else if (response.data && response.data[0] && response.data[0].generated_text) {
        let answer = response.data[0].generated_text;
        if (answer.includes(question)) {
          answer = answer.replace(question, '').trim();
        }
        return answer || `Ответ от ${model.name}`;
      }
      
    } catch (error) {
      console.log(`${model.name} failed:`, error.response?.status || error.message);
      // Пробуем следующую модель
      continue;
    }
  }
  
  // Если все модели не сработали
  return '❌ Все модели ИИ временно недоступны. \n\nПопробуй:\\n• Перезагрузить бот через 5 минут\\n• Использовать другие команды\\n• Написать создателю: @ch0nyatski';
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🧠 Спросить ИИ', '📞 Контакты'],
        ['🕐 Время', '🔧 Статус ИИ']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я бот с ИИ от Hugging Face! 🧠\n\n' +
    'Я пробую подключиться к разным нейросетям:\n' +
    '• Facebook Blenderbot\n' +
    '• Google T5\n' + 
    '• Microsoft DialoGPT\n\n' +
    'Задай вопрос - проверю что работает!', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🧠 Спросить ИИ') {
    bot.sendMessage(chatId, 'Напиши вопрос! Пробую подключиться к доступным нейросетям... 🧠\n\n*Проверяю 3 разные модели*');
  } 
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, '👨‍💻 Создатель: @ch0nyatski\n\nПомощь с интеграцией ИИ');
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, `🕐 ${new Date().toLocaleString('ru-RU')}`);
  }
  else if (text === '🔧 Статус ИИ') {
    bot.sendMessage(chatId, 
      '🔧 *Статус ИИ систем:*\n\n' +
      '• 🤖 Пробую разные модели\n' +
      '• 🔄 Автоматический перебор\n' + 
      '• ⚡ Таймаут 20 сек на модель\n' +
      '• 📊 В логах видно что работает\n\n' +
      'Напиши вопрос - протестируем!'
    );
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🧠 Проверяю доступные нейросети...\n*Это займет до 60 секунд*');
    
    try {
      const aiResponse = await askAI(text);
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, `🤖 *Результат:*\n\n${aiResponse}`);
    } catch (error) {
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, '💥 Критическая ошибка при подключении ко всем моделям.');
    }
  }
});

console.log('Бот с мульти-модельным подходом запущен!');
