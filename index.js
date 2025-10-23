const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

process.env.NTBA_FIX_319 = 1;

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server started on port ' + port);
});

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {
  polling: {
    interval: 1000,
    params: { timeout: 10 }
  }
});

bot.on('polling_error', (error) => {
  console.log('Polling error:', error.message);
});

// Функция для запроса к Hugging Face
async function askHuggingFace(question) {
  try {
    console.log('Sending to HF:', question);
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        inputs: question
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('HF Response:', response.data);
    
    if (response.data && response.data.generated_text) {
      return response.data.generated_text;
    } else {
      return '🤖 ИИ обработал запрос, но не сгенерировал ответ';
    }
  } catch (error) {
    console.log('Hugging Face Error:', error.response?.data || error.message);
    return '⚠️ ИИ временно недоступен. Попробуйте позже.';
  }
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const options = {
    reply_markup: {
      keyboard: [
        ['❓ Спросить у ИИ', '📞 Контакты'],
        ['🕐 Время', '🎲 Факт']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(msg.chat.id, 
    'Привет! Я бот с ИИ от Hugging Face! 🧠\nНапиши любой вопрос или нажми "Спросить у ИИ"', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '❓ Спросить у ИИ') {
    bot.sendMessage(chatId, 'Напиши свой вопрос и я передам его ИИ!');
  } 
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, 'Создатель: @ch0nyatski');
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, 'Время: ' + new Date().toLocaleString('ru-RU'));
  }
  else if (text === '🎲 Факт') {
    const facts = [
      'Коты спят 70% жизни 😴',
      'Мед никогда не портится 🍯',
      'Телеграм создали в 2013 году'
    ];
    bot.sendMessage(chatId, 'Факт: ' + facts[Math.floor(Math.random() * facts.length)]);
  }
  else if (!text.startsWith('/')) {
    // Если обычное сообщение - отправляем ИИ
    if (text !== '❓ Спросить у ИИ' && text !== '📞 Контакты' && 
        text !== '🕐 Время' && text !== '🎲 Факт') {
      
      const thinkingMsg = await bot.sendMessage(chatId, '🤔 Думаю над ответом...');
      const aiResponse = await askHuggingFace(text);
      
      // Удаляем сообщение "Думаю..." и отправляем ответ
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, aiResponse);
    }
  }
});

console.log('Бот с Hugging Face ИИ запущен!');
