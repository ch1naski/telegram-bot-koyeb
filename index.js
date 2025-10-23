const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

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

// База музыкальных рекомендаций
const musicDatabase = {
  'рок': [
    { title: 'Queen - Bohemian Rhapsody', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
    { title: 'Led Zeppelin - Stairway to Heaven', url: 'https://www.youtube.com/watch?v=QkF3oxiDcdk' },
    { title: 'The Beatles - Hey Jude', url: 'https://www.youtube.com/watch?v=A_MjCqQoLLA' },
    { title: 'AC/DC - Back In Black', url: 'https://www.youtube.com/watch?v=pAgnJDJN4VA' }
  ],
  'поп': [
    { title: 'Taylor Swift - Shake It Off', url: 'https://www.youtube.com/watch?v=nfWlot6h_JM' },
    { title: 'Ed Sheeran - Shape of You', url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' },
    { title: 'Adele - Rolling in the Deep', url: 'https://www.youtube.com/watch?v=rYEDA3JcQqw' },
    { title: 'Bruno Mars - Uptown Funk', url: 'https://www.youtube.com/watch?v=OPf0YbXqDm0' }
  ],
  'хип-хоп': [
    { title: 'Eminem - Lose Yourself', url: 'https://www.youtube.com/watch?v=_Yhyp-_hX2s' },
    { title: 'Drake - God\'s Plan', url: 'https://www.youtube.com/watch?v=xpVfcZ0ZcFM' },
    { title: 'Kendrick Lamar - HUMBLE.', url: 'https://www.youtube.com/watch?v=tvTRZJ-4EyI' },
    { title: 'Travis Scott - SICKO MODE', url: 'https://www.youtube.com/watch?v=6ONRf7h3Mdk' }
  ],
  'электронная': [
    { title: 'Daft Punk - Get Lucky', url: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I' },
    { title: 'Calvin Harris - Feel So Close', url: 'https://www.youtube.com/watch?v=dGghkjpNCQ8' },
    { title: 'Avicii - Wake Me Up', url: 'https://www.youtube.com/watch?v=IcrbM1l_BoI' },
    { title: 'David Guetta - Titanium', url: 'https://www.youtube.com/watch?v=JRfuAukYTKg' }
  ],
  'классика': [
    { title: 'Beethoven - Symphony No. 5', url: 'https://www.youtube.com/watch?v=fOk8Tm815lE' },
    { title: 'Mozart - Eine kleine Nachtmusik', url: 'https://www.youtube.com/watch?v=Qb_jQBgzU-I' },
    { title: 'Tchaikovsky - Swan Lake', url: 'https://www.youtube.com/watch?v=9cNQ8T2vPCk' },
    { title: 'Vivaldi - Four Seasons', url: 'https://www.youtube.com/watch?v=GRxofEmo3HA' }
  ],
  'джаз': [
    { title: 'Louis Armstrong - What a Wonderful World', url: 'https://www.youtube.com/watch?v=CWzrABouyeE' },
    { title: 'Frank Sinatra - Fly Me To The Moon', url: 'https://www.youtube.com/watch?v=ZEcqHA7dbwM' },
    { title: 'Ella Fitzgerald - Summertime', url: 'https://www.youtube.com/watch?v=LMuV4X4rW1c' },
    { title: 'Dave Brubeck - Take Five', url: 'https://www.youtube.com/watch?v=vmDDOFXSgAs' }
  ]
};

// Функция для поиска музыки
function findMusic(query) {
  const lowerQuery = query.toLowerCase();
  
  // Поиск по жанрам
  for (const [genre, songs] of Object.entries(musicDatabase)) {
    if (lowerQuery.includes(genre)) {
      const randomSong = songs[Math.floor(Math.random() * songs.length)];
      return {
        found: true,
        message: `🎵 *${genre.toUpperCase()} рекомендация:*\n\n**${randomSong.title}**\n\nСсылка: ${randomSong.url}`,
        song: randomSong
      };
    }
  }
  
  // Поиск по настроению
  if (lowerQuery.includes('груст') || lowerQuery.includes('печал')) {
    const sadSongs = [...musicDatabase['классика'], ...musicDatabase['джаз']];
    const randomSong = sadSongs[Math.floor(Math.random() * sadSongs.length)];
    return {
      found: true,
      message: `🎵 *Для грустного настроения:*\n\n**${randomSong.title}**\n\nСсылка: ${randomSong.url}`,
      song: randomSong
    };
  }
  
  if (lowerQuery.includes('весел') || lowerQuery.includes('танц')) {
    const happySongs = [...musicDatabase['поп'], ...musicDatabase['электронная']];
    const randomSong = happySongs[Math.floor(Math.random() * happySongs.length)];
    return {
      found: true,
      message: `🎵 *Для веселого настроения:*\n\n**${randomSong.title}**\n\nСсылка: ${randomSong.url}`,
      song: randomSong
    };
  }
  
  if (lowerQuery.includes('энерг') || lowerQuery.includes('спорт')) {
    const energySongs = [...musicDatabase['рок'], ...musicDatabase['хип-хоп']];
    const randomSong = energySongs[Math.floor(Math.random() * energySongs.length)];
    return {
      found: true,
      message: `🎵 *Для энергии:*\n\n**${randomSong.title}**\n\nСсылка: ${randomSong.url}`,
      song: randomSong
    };
  }
  
  // Случайная рекомендация
  const allGenres = Object.keys(musicDatabase);
  const randomGenre = allGenres[Math.floor(Math.random() * allGenres.length)];
  const randomSong = musicDatabase[randomGenre][Math.floor(Math.random() * musicDatabase[randomGenre].length)];
  
  return {
    found: false,
    message: `🎵 *Случайная рекомендация (${randomGenre}):*\n\n**${randomSong.title}**\n\nСсылка: ${randomSong.url}`,
    song: randomSong
  };
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🎵 Найти музыку', '🎸 По жанрам'],
        ['🎧 Случайный трек', '📞 Контакты']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я *Музыкальный Бот*! 🎵\n\n' +
    'Я могу:\n' +
    '• Найти музыку по жанру\n' +
    '• Рекомендовать по настроению\n' +
    '• Дать случайный трек\n\n' +
    'Просто напиши:\n' +
    '• "рок", "поп", "хип-хоп"\n' +
    '• "грустная музыка"\n' +
    '• "для танцев"\n' +
    '• Или любой запрос!', 
    options
  );
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) return;

  if (text === '🎵 Найти музыку') {
    bot.sendMessage(chatId, 'Напиши что ищешь:\n• Жанр (рок, поп, джаз...)\n• Настроение (грустная, веселая...)\n• Или просто тему!');
  } 
  else if (text === '🎸 По жанрам') {
    bot.sendMessage(chatId, 
      '🎵 *Доступные жанры:*\n\n' +
      '• 🎸 Рок\n' +
      '• 🎤 Поп\n' +
      '• 🎧 Хип-хоп\n' +
      '• 💿 Электронная\n' +
      '• 🎻 Классика\n' +
      '• 🎷 Джаз\n\n' +
      'Напиши название жанра!'
    );
  }
  else if (text === '🎧 Случайный трек') {
    const result = findMusic('случайный');
    bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
  }
  else if (text === '📞 Контакты') {
    bot.sendMessage(chatId, '👨‍💻 Создатель: @ch0nyatski\n\nМузыкальный бот 🎵');
  }
  else {
    const thinkingMsg = await bot.sendMessage(chatId, '🎵 Ищу музыку...');
    
    try {
      const result = findMusic(text);
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      
      if (result.found) {
        bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, 
          `${result.message}\n\n*Не нашел точного совпадения, вот случайная рекомендация!*`, 
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      bot.deleteMessage(chatId, thinkingMsg.message_id);
      bot.sendMessage(chatId, '❌ Ошибка поиска музыки. Попробуй другой запрос.');
    }
  }
});

console.log('Музыкальный бот запущен! 🎵');
