const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Music Bot is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log('Server started on port ' + port);
});

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Музыкальная база
const musicDatabase = {
  'рок': [
    { title: 'Queen - Bohemian Rhapsody', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
    { title: 'Led Zeppelin - Stairway to Heaven', url: 'https://www.youtube.com/watch?v=QkF3oxiDcdk' }
  ],
  'поп': [
    { title: 'Taylor Swift - Shake It Off', url: 'https://www.youtube.com/watch?v=nfWlot6h_JM' },
    { title: 'Ed Sheeran - Shape of You', url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' }
  ],
  'хип-хоп': [
    { title: 'Eminem - Lose Yourself', url: 'https://www.youtube.com/watch?v=_Yhyp-_hX2s' },
    { title: 'Drake - God\'s Plan', url: 'https://www.youtube.com/watch?v=xpVfcZ0ZcFM' }
  ],
  'электронная': [
    { title: 'Daft Punk - Get Lucky', url: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I' },
    { title: 'Avicii - Wake Me Up', url: 'https://www.youtube.com/watch?v=IcrbM1l_BoI' }
  ]
};

// Поиск музыки
function findMusic(query) {
  const lowerQuery = query.toLowerCase();
  
  for (const [genre, songs] of Object.entries(musicDatabase)) {
    if (lowerQuery.includes(genre)) {
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      return `🎵 *${genre.toUpperCase()}:* ${randomSong.title}\n\n${randomSong.url}`;
    }
  }
  
  // Случайная песня
  const allGenres = Object.keys(musicDatabase);
  const randomGenre = allGenres[Math.floor(Math.random() * allGenres.length)];
  const randomSong = musicDatabase[randomGenre][Math.floor(Math.random() * musicDatabase[randomGenre].length)];
  
  return `🎵 *Случайный трек (${randomGenre}):* ${randomSong.title}\n\n${randomSong.url}`;
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🎵 Найти музыку', '🎧 Случайный трек'],
        ['🎸 Жанры', '📞 Контакты']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я музыкальный бот! 🎵\n\nНапиши жанр: рок, поп, хип-хоп, электронная', 
    options
  );
});

// Обработка сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🎵 Найти музыку') {
    bot.sendMessage(chatId, 'Напиши жанр музыки: рок, поп, хип-хоп, электронная');
  } 
  else if (text === '🎧 Случайный трек') {
    const result = findMusic('случайный');
    bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
  }
  else if (text === '🎸 Жанры') {
    bot.sendMessage(chatId, 'Доступные жанры:\n• Рок\n• Поп\n• Хип-хоп\n• Электронная');
  }
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, 'Создатель: @ch0nyatski');
  }
  else {
    const result = findMusic(text);
    bot.sendMessage(chatId, result, { parse_mode: 'Markdown' });
  }
});

console.log('Музыкальный бот запущен! 🎵');
