// Функция для запроса к Hugging Face через Inference API
async function askAI(question) {
  try {
    console.log('Asking AI:', question);

    // Вариант с использованием API для чат-моделей
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
      {
        inputs: question,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          do_sample: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000 // Увеличиваем таймаут для загрузки модели
      }
    );

    console.log('AI Response:', response.data);

    // Обработка ответа для текстовой генерации
    if (response.data && response.data[0] && response.data[0].generated_text) {
      let answer = response.data[0].generated_text;
      // Очищаем ответ, удаляя оригинальный вопрос, если он есть
      if (answer.includes(question)) {
        answer = answer.replace(question, '').trim();
      }
      return answer;
    } else {
      return '🤖 ИИ обработал запрос, но ответ имеет неожиданный формат.';
    }
  } catch (error) {
    console.log('Hugging Face Error:', error.response?.data || error.message);
    
    // Обработка ошибки "модель загружается"
    if (error.response?.status === 503) {
      const estimatedTime = error.response.data.estimated_time;
      console.log(`Model is loading. Estimated time: ${estimatedTime} seconds.`);
      return `⚠️ Модель просыпается и загружается. Это займет около ${estimatedTime || 30} секунд. Пожалуйста, повтори запрос через минуту.`;
    }
    
    return '⚠️ Не удалось получить ответ от ИИ. Попробуй спросить что-то другое.';
  }
}
