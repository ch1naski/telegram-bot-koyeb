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

// ОБНОВЛЕННАЯ функция с новыми моделями
async function askAI(question) {
  const models = [
    {
      name: 'TinyLlama Chat',
      url: 'https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
      format: 'generated_text'
    },
    {
      name: 'Mistral 7B', 
      url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-v0.1',
      format: 'generated_text'
    },
    {
      name: 'Zephyr 7B',
      url: 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      format: 'generated_text'
    },
    {
      name: 'Google Gemma',
      url: 'https://api-inference.huggingface.co/models/google/gemma-7b',
      format: 'generated_text'
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
            max_new_tokens: 200,
            temperature: 0.8,
            do_sample: true,
            top_p: 0.9
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

      console.log(`${model.name} response:`, response.data);

      // Универсальная обработка ответа
      if (response.data && response.data[0] && response.data[0].generated_text) {
        let answer = response.data[0].generated_text;
        // Очищаем ответ от повторения вопроса
        if (answer.toLowerCase().includes(question.toLowerCase())) {
          answer = answer.replace(new RegExp(question, 'gi'), '').trim();
        }
        return answer || `🤖 ${model.name} ответил на ваш вопрос`;
      }
      
    } catch (error) {
      console.log(`${model.name} failed:`, error.response?.status || error.message);
      
      // Если модель загружается - ждем и пробуем снова
      if (error.response?.status === 503) {
        const waitTime = error.response.data.estimated_time || 30;
        console.log(`Model ${model.name} is loading, waiting ${waitTime} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        continue; // Пробуем эту модель еще раз после ожидания
      }
      
      // Пробуем следующую модель
      continue;
    }
  }
  
  // Если все модели не сработали
  return '❌ Все модели ИИ временно недоступны. \n\nВозможные причины:\n• Модели загружаются (может занять до 30 сек)\n• Превышен лимит запросов\n• Проблемы с сетью\n\nПопробуй через 2-3 минуты!';
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
    'Привет! Я бот с улучшенным ИИ! 🧠\n\n' +
    'Теперь я пробую более новые модели:\n' +
    '• TinyLlama 1.1B Chat\n' +
    '• Mistral 7B\n' + 
    '• Zephyr 7B\n' +
    '• Google Gemma 7B\n\n' +
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
    bot.sendMessage(chatId, 'Напиши вопрос! Пробую подключиться к новым нейросетям... 🧠\n\n*Проверяю 4 современные модели*');
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
      '• 🤖 4 современные модели\n' +
      '• 🔄 Автоповтор при загрузке\n' + 
      '• ⏳ Ожидание 30 сек если модель спит\n' +
      '• 📊 Лучшие шансы на работу\n\n' +
      'Первые запросы могут занимать до 30 секунд!'
    );
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🧠 Проверяю современные нейросети...\n*Первые запросы могут занимать до 30 секунд*');
    
    try {
      const aiResponse = await askAI(text);
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, `🤖 *Результат:*\n\n${aiResponse}`);
    } catch (error) {
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, '💥 Все модели недоступны. Попробуй через 5 минут.');
    }
  }
});

console.log('Бот с улучшенными моделями запущен!');
