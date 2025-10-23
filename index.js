const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

process.env.NTBA_FIX_319 = 1;

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Bot with AI is running!');
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

// Функция для запроса к Hugging Face - УЛУЧШЕННАЯ
async function askHuggingFace(question) {
  try {
    console.log('Sending to HF:', question);
    
    const response = await axios.post(
      // ИСПОЛЬЗУЕМ МОДЕЛЬ, КОТОРАЯ ТОЧНО РАБОТАЕТ
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-small',
      {
        inputs: {
          text: question,
          // Добавляем контекст для лучших ответов
          past_user_inputs: [],
          generated_responses: []
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000 // Увеличиваем таймаут
      }
    );
    
    console.log('HF Response:', response.data);
    
    // Обработка ответа для DialoGPT
    if (response.data && response.data.generated_text) {
      return response.data.generated_text;
    } else {
      return '🤖 ИИ обработал запрос, но не сгенерировал ответ.';
    }
  } catch (error) {
    console.log('Hugging Face Error:', error.response?.status, error.response?.data);
    
    // Если модель загружается - пробуем подождать
    if (error.response?.status === 503) {
      const waitTime = error.response.data.estimated_time || 30;
      console.log(`Model is loading, waiting ${waitTime} seconds...`);
      
      // Ждем и пробуем снова
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      return askHuggingFace(question); // Рекурсивный вызов
    }
    
    return '⚠️ ИИ временно недоступен. Используйте другие команды бота.';
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
    'Привет! Я бот с ИИ от Hugging Face! 🧠\nНапиши любой вопрос или нажми "Спросить у ИИ"\n\n*ИИ может отведать 10-30 секунд при первом запросе*', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем служебные сообщения
  if (!text || text.startsWith('/')) return;

  if (text === '❓ Спросить у ИИ') {
    bot.sendMessage(chatId, 'Напиши свой вопрос и я передам его ИИ! 🧠\n\n*Первые ответы могут занимать до 30 секунд*');
  } 
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, 'Создатель: @ch0nyatski');
  }
  else if (text === '🕐 Время') {
    bot.sendMessage(chatId, '⏰ Время: ' + new Date().toLocaleString('ru-RU'));
  }
  else if (text === '🎲 Факт') {
    const facts = [
      'Коты спят 70% жизни 😴',
      'Мед никогда не портится 🍯',
      'Телеграм создали в 2013 году',
      'Python назван в честь комедийного шоу 🐍',
      'Первый компьютерный вирус появился в 1986 году'
    ];
    bot.sendMessage(chatId, '📚 Факт: ' + facts[Math.floor(Math.random() * facts.length)]);
  }
  else {
    // Если обычное сообщение - отправляем ИИ
    const thinkingMsg = await bot.sendMessage(chatId, '🤔 Думаю над ответом...\n*Это может занять до 30 секунд*');
    
    try {
      const aiResponse = await askHuggingFace(text);
      
      // Удаляем сообщение "Думаю..." и отправляем ответ
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, aiResponse);
    } catch (error) {
      // Если ошибка - показываем сообщение об ошибке
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, '❌ Произошла ошибка при обращении к ИИ. Попробуйте позже.');
    }
  }
});

console.log('Бот с DialoGPT-small ИИ запущен!');
