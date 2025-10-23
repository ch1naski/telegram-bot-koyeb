const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Music Download Bot is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log('🎵 Music Download Bot started on port', port);
});

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { 
  polling: {
    interval: 300,
    timeout: 10,
    limit: 100
  }
});

// Создаем папку для временных файлов
const tempDir = './temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Очистка старых временных файлов
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 минут
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up old file:', file);
      }
    });
  } catch (error) {
    console.log('Cleanup error:', error.message);
  }
}

// Запускаем очистку каждые 10 минут
setInterval(cleanupTempFiles, 10 * 60 * 1000);

// Функция для поиска на YouTube
async function searchYouTube(query) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' official audio')}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Ищем videoId в HTML
    const videoIdMatch = html.match(/"videoId":"([^"]{11})"/);
    if (videoIdMatch && videoIdMatch[1]) {
      return `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
    }
    
    return null;
  } catch (error) {
    console.log('YouTube search error:', error.message);
    return null;
  }
}

// Функция для скачивания аудио
async function downloadAudio(youtubeUrl, chatId) {
  return new Promise((resolve, reject) => {
    try {
      const videoId = new URL(youtubeUrl).searchParams.get('v') || youtubeUrl.split('v=')[1];
      const tempFile = path.join(tempDir, `${videoId}_${chatId}_${Date.now()}.mp3`);
      
      console.log('Starting download:', youtubeUrl);
      
      const videoStream = ytdl(youtubeUrl, {
        filter: 'audioonly',
        quality: 'highestaudio',
      });
      
      const writeStream = fs.createWriteStream(tempFile);
      
      videoStream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        console.log('Download completed:', tempFile);
        resolve(tempFile);
      });
      
      writeStream.on('error', (error) => {
        console.log('Write stream error:', error);
        reject(error);
      });
      
      videoStream.on('error', (error) => {
        console.log('Video stream error:', error);
        reject(error);
      });
      
    } catch (error) {
      console.log('Download function error:', error);
      reject(error);
    }
  });
}

// Функция для получения информации о видео
async function getVideoInfo(youtubeUrl) {
  try {
    const info = await ytdl.getInfo(youtubeUrl);
    return {
      title: info.videoDetails.title.replace(/[^\w\sа-яА-Я]/gi, ' ').trim(),
      duration: Math.round(info.videoDetails.lengthSeconds / 60) + ' мин',
      thumbnail: info.videoDetails.thumbnails[0]?.url
    };
  } catch (error) {
    console.log('Video info error:', error.message);
    return null;
  }
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [
        ['🎵 Скачать трек', '📞 Контакты'],
        ['ℹ️ Помощь', '⚡ Быстрый поиск']
      ],
      resize_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 
    'Привет! Я *Музыкальный Бот*! 🎵\n\n' +
    'Я могу скачать *ЛЮБОЙ* трек с YouTube и отправить тебе аудиофайл!\n\n' +
    '*Как работает:*\n' +
    '1. Ты пишешь название трека\n' +
    '2. Я ищу на YouTube\n' + 
    '3. Скачиваю аудиодорожку\n' +
    '4. Отправляю MP3 файл\n\n' +
    '*Слушай прямо в Telegram!* 🎧', 
    options
  );
});

// Обработка ошибок бота
bot.on('polling_error', (error) => {
  console.log('Polling error:', error.message);
});

bot.on('webhook_error', (error) => {
  console.log('Webhook error:', error.message);
});

// Обработка сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем служебные сообщения
  if (!text || text.startsWith('/')) return;

  if (text === '🎵 Скачать трек') {
    bot.sendMessage(chatId, 
      'Напиши название трека и исполнителя!\n\n' +
      '*Примеры:*\n' +
      '• The Weeknd - Blinding Lights\n' +
      '• Dua Lipa - Levitating\n' + 
      '• Metallica - Nothing Else Matters\n' +
      '• Любой другой трек!\n\n' +
      '*Скачаю и отправлю аудиофайл!* 🎧',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  if (text === '📞 Контакты') {
    bot.sendMessage(chatId, '👨‍💻 Создатель: @ch0nyatski\n\nМузыкальный бот 🎵');
    return;
  }
  
  if (text === 'ℹ️ Помощь') {
    bot.sendMessage(chatId, 
      '🎵 *Инструкция:*\n\n' +
      '1. Напиши *название трека*\n' +
      '2. Можно добавить *исполнителя*\n' +
      '3. Жди 1-3 минуты\n' +
      '4. Получи *MP3 файл*\n\n' +
      '*Работает с любыми треками!* 🌍\n' +
      '*Внимание:* Длительные треки могут не скачаться',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  if (text === '⚡ Быстрый поиск') {
    const quickSongs = [
      'The Weeknd - Blinding Lights',
      'Dua Lipa - Levitating', 
      'Harry Styles - As It Was',
      'Metallica - Enter Sandman',
      'Eminem - Lose Yourself'
    ];
    
    let quickList = '⚡ *Быстрый поиск:*\n\n';
    quickSongs.forEach(song => {
      quickList += `• ${song}\n`;
    });
    quickList += '\nНапиши любой из этих треков!';
    
    bot.sendMessage(chatId, quickList, { parse_mode: 'Markdown' });
    return;
  }

  // Обработка запроса на скачивание
  let processingMsg;
  try {
    processingMsg = await bot.sendMessage(chatId, '🔍 *Ищу трек на YouTube...*', { parse_mode: 'Markdown' });

    // Ищем трек на YouTube
    const youtubeUrl = await searchYouTube(text);
    
    if (!youtubeUrl) {
      await bot.editMessageText('❌ *Не удалось найти трек на YouTube*\n\nПопробуй другой запрос или уточни название', {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    // Получаем информацию о видео
    await bot.editMessageText('📥 *Нашел трек, получаю информацию...*', {
      chat_id: chatId,
      message_id: processingMsg.message_id, 
      parse_mode: 'Markdown'
    });

    const videoInfo = await getVideoInfo(youtubeUrl);
    
    if (!videoInfo) {
      await bot.editMessageText('❌ *Ошибка получения информации о треке*', {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        parse_mode: 'Markdown'
      });
      return;
    }

    // Скачиваем аудио
    await bot.editMessageText(`🎵 *Скачиваю:* ${videoInfo.title}\n⏱ *Длительность:* ${videoInfo.duration}`, {
      chat_id: chatId,
      message_id: processingMsg.message_id,
      parse_mode: 'Markdown'
    });

    const audioFile = await downloadAudio(youtubeUrl, chatId);
    
    if (!fs.existsSync(audioFile)) {
      throw new Error('Файл не был создан');
    }

    // Отправляем аудиофайл
    await bot.editMessageText('📤 *Отправляю аудиофайл...*', {
      chat_id: chatId,
      message_id: processingMsg.message_id,
      parse_mode: 'Markdown'
    });

    // Читаем файл для отправки
    const audioStream = fs.createReadStream(audioFile);
    
    await bot.sendAudio(chatId, audioStream, {
      caption: `🎵 ${videoInfo.title}\n⏱ ${videoInfo.duration}\n\nСлушай прямо в Telegram! 🎧`,
      title: videoInfo.title.substring(0, 64),
      performer: 'YouTube'
    }, {
      filename: `${videoInfo.title.substring(0, 50)}.mp3`
    });

    // Удаляем временный файл
    try {
      fs.unlinkSync(audioFile);
    } catch (unlinkError) {
      console.log('Error deleting temp file:', unlinkError.message);
    }

    await bot.deleteMessage(chatId, processingMsg.message_id);

  } catch (error) {
    console.log('Main error:', error);
    
    if (processingMsg) {
      await bot.editMessageText('❌ *Ошибка при скачивании*\n\nВозможно:\n• Трек слишком длинный\n• Проблемы с YouTube\n• Попробуй другой трек', {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        parse_mode: 'Markdown'
      }).catch(e => console.log('Edit message error:', e.message));
    } else {
      bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуй еще раз.');
    }
  }
});

console.log('🎵 Музыкальный бот для скачивания запущен и готов к работе!');
