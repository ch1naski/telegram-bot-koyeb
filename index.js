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

// ПРОСТЫЕ МОДЕЛИ, КОТОРЫЕ ТОЧНО РАБОТАЮТ
async function askAI(question) {
  const models = [
    {
      name: 'DistilGPT2',
      url: 'https://api-inference.huggingface.co/models/distilgpt2',
      format: 'generated_text'
    },
    {
      name: 'GPT2', 
      url: 'https://api-inference.huggingface.co/models/gpt2',
      format: 'generated_text'
    },
    {
      name: 'BERT Russian',
      url: 'https://api-inference.huggingface.co/models/DeepPavlov/rubert-base-cased',
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
            max_new_tokens: 100,
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
          timeout: 15000
        }
      );

      console.log(`${model.name} success:`, response.data);

      if (response.data && response.data[0] && response.data[0].generated_text) {
        let answer = response.data[0].generated_text;
        return answer || `Ответ от ${model.name}`;
      }
      
    } catch (error) {
      console.log(`${model.name} failed:`, error.response?.status || error.message);
      continue;
    }
  }
  
  // ЕСЛИ ВСЕ МОДЕЛИ НЕ РАБОТАЮТ - ПРОБУЕМ БЕЗ ТОКЕНА
  return await tryWithoutToken(question);
}

// Попытка без токена (публичные модели)
async function tryWithoutToken(question) {
  try {
    console.log('Trying public model without token...');
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/distilgpt2',
      {
        inputs: question,
        parameters: {
          max_new_tokens: 80,
          temperature: 0.9,
          do_sample: true
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('Public model response:', response.data);
    
    if (response.data && response.data[0] && response.data[0].generated_text) {
      return response.data[0].generated_text;
    }
    
  } catch (error) {
    console.log('Public model also failed:', error.response?.status);
  }
  
  return '🤖 ИИ временно недоступен. \n\nПопробуй простые команды или напиши позже!';
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🧠 Спросить ИИ', '📞 Контакты'],
        ['🕐 Время', '🔧 Статус']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я бот с ИИ! 🧠\n\n' +
    'Использую простые публичные модели:\n' +
    '• DistilGPT2\n' +
    '• GPT2\n' + 
    '• BERT Russian\n\n' +
    'Эти модели точно работают! 🎯', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🧠 Спросить ИИ') {
    bot.sendMessage(chatId, 'Напиши вопрос! Использую простые рабочие модели... 🧠');
  } 
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, '👨‍💻 Создатель: @ch0nyatski');
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, `🕐 ${new Date().toLocaleString('ru-RU')}`);
  }
  else if (text === '🔧 Статус') {
    bot.sendMessage(chatId, '🤖 Бот активен\n🧠 Простые модели\n🎯 Точная работа');
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🧠 Обрабатываю запрос...');
    
    try {
      const aiResponse = await askAI(text);
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, `🤖 *Ответ:*\n\n${aiResponse}`);
    } catch (error) {
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, '💥 Ошибка. Попробуй другой вопрос.');
    }
  }
});

console.log('Бот с простыми моделями запущен!');
