/**
 * Start UI Module
 * Beautiful welcome message with inline keyboard
 * 
 * @author G'ulomov Akmal
 * @version 1.0.0
 */

const { Markup } = require('telegraf');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BOT_USERNAME = process.env.BOT_USERNAME || 'CD_Video_Downloaderbot';
const GROUP_ADD_LINK = `https://t.me/${BOT_USERNAME}?startgroup=true`;

// ============================================================================
// START MESSAGE
// ============================================================================

/**
 * Generate beautiful start message
 * @param {Object} user - Telegram user object
 * @returns {string} Formatted message
 */
const generateStartMessage = (user) => {
    const firstName = user?.first_name || 'Друг';
    
    const message = `
👋 **Добро пожаловать, ${firstName}!**

🤖 **Я - Ваш умный помощник для загрузки видео и музыки!**

━━━━━━━━━━━━━━━━━━━━

🎬 **Что я умею:**

▫️ 📥 **Загрузка видео** с YouTube, Instagram, TikTok, Facebook и других платформ
▫️ 🎨 **Каталог дизайнов** - просмотрите наши готовые шаблоны (/designs)
▫️ 🎵 **Поиск музыки** - отправьте название песни, и я найду её для Вас
▫️ 🎼 **Библиотека музыки** - готовые треки для Ваших видео (/music_list)
▫️ 💾 **Умное кэширование** - повторные загрузки происходят мгновенно
▫️ 📊 **Выбор качества** - выберите нужное качество перед загрузкой

━━━━━━━━━━━━━━━━━━━━

⚡ **Быстрый старт:**

1️⃣ Отправьте ссылку на видео для загрузки
2️⃣ Отправьте название песни для поиска
3️⃣ Отправьте аудио/голосовое сообщение для распознавания

━━━━━━━━━━━━━━━━━━━━

👥 **Добавьте меня в группу!**

Нажмите кнопку ниже, чтобы добавить меня в Вашу группу и пользоваться всеми функциями прямо в чате!

━━━━━━━━━━━━━━━━━━━━

💡 **Команды:**

/start - Запустить меня заново
/help - Помощь и информация
/myid - Узнать Ваш Telegram ID
/cookies - Инструкция по настройке cookies
/stats - Статистика бота (только админ)

━━━━━━━━━━━━━━━━━━━━

🎯 **Просто отправьте мне ссылку или название песни, и я всё сделаю за Вас!**
    `.trim();
    
    return message;
};

/**
 * Generate inline keyboard for start message
 * @returns {Markup} Inline keyboard
 */
const generateStartKeyboard = () => {
    const keyboard = [
        [
            {
                text: '➕ Добавить в группу 💭',
                url: GROUP_ADD_LINK,
            },
        ],
        [
            {
                text: '🎨 Dizaynlar (Templates) ✨',
                callback_data: 'start_designs',
            },
        ],
        [
            {
                text: '🎵 Musiqalar ro\'yxati 🎼',
                callback_data: 'start_music',
            },
        ],
        [
            {
                text: '📺 YouTube',
                callback_data: 'help_youtube',
            },
            {
                text: '📸 Instagram',
                callback_data: 'help_instagram',
            },
        ],
        [
            {
                text: '🎵 TikTok',
                callback_data: 'help_tiktok',
            },
            {
                text: '📘 Facebook',
                callback_data: 'help_facebook',
            },
        ],
        [
            {
                text: '❓ Помощь',
                callback_data: 'help_main',
            },
            {
                text: '👤 О боте',
                callback_data: 'about_bot',
            },
        ],
    ];
    
    return Markup.inlineKeyboard(keyboard);
};

// ============================================================================
// HELP MESSAGES
// ============================================================================

/**
 * Get help message by category
 * @param {string} category - Help category
 * @returns {Object} { text, keyboard }
 */
const getHelpMessage = (category) => {
    const helpMessages = {
        main: {
            text: `
❓ **Помощь**

Выберите платформу для получения подробной инструкции:

📺 **YouTube** - загрузка видео с YouTube
📸 **Instagram** - загрузка Reels, Stories, IGTV
🎵 **TikTok** - загрузка видео без водяного знака
📘 **Facebook** - загрузка видео из Facebook

Или вернитесь в главное меню:
            `.trim(),
            keyboard: [
                [
                    { text: '📺 YouTube', callback_data: 'help_youtube' },
                    { text: '📸 Instagram', callback_data: 'help_instagram' },
                ],
                [
                    { text: '🎵 TikTok', callback_data: 'help_tiktok' },
                    { text: '📘 Facebook', callback_data: 'help_facebook' },
                ],
                [
                    { text: '🔙 Назад', callback_data: 'start_back' },
                ],
            ],
        },
        
        youtube: {
            text: `
📺 **Загрузка с YouTube**

**Поддерживаемые форматы:**
• 1080p, 720p, 480p, 360p, 240p, 144p
• 60fps (для видео с высокой частотой кадров)
• Аудио: MP3, M4A

**Как использовать:**
1. Отправьте ссылку на видео YouTube
2. Выберите качество из предложенных вариантов
3. Дождитесь загрузки и получите видео

**Примеры ссылок:**
• https://www.youtube.com/watch?v=VIDEO_ID
• https://youtu.be/VIDEO_ID
• https://www.youtube.com/shorts/VIDEO_ID

💡 **Совет:** Для загрузки только аудио выберите "Audio Only"
            `.trim(),
            keyboard: [
                [
                    { text: '🔙 Назад', callback_data: 'help_main' },
                ],
            ],
        },
        
        instagram: {
            text: `
📸 **Загрузка с Instagram**

**Поддерживаемый контент:**
• Reels (короткие видео)
• Posts (обычные публикации)
• IGTV (длинные видео)
• Stories (требуется cookies)

**Как использовать:**
1. Отправьте ссылку на пост/Reels
2. Бот автоматически загрузит видео

**Важно:** Для некоторых видео могут потребоваться cookies
Используйте команду /cookies для настройки

**Примеры ссылок:**
• https://www.instagram.com/reel/REEL_ID/
• https://www.instagram.com/p/POST_ID/
• https://www.instagram.com/tv/IGTV_ID/
            `.trim(),
            keyboard: [
                [
                    { text: '🍪 Настроить Cookies', callback_data: 'help_cookies' },
                ],
                [
                    { text: '🔙 Назад', callback_data: 'help_main' },
                ],
            ],
        },
        
        tiktok: {
            text: `
🎵 **Загрузка с TikTok**

**Особенности:**
• ✅ Загрузка без водяного знака
• ✅ Высокое качество
• ✅ Быстрая обработка

**Как использовать:**
1. Отправьте ссылку на TikTok видео
2. Бот загрузит видео без водяного знака

**Примеры ссылок:**
• https://www.tiktok.com/@username/video/VIDEO_ID
• https://vm.tiktok.com/SHORT_ID/
• https://vt.tiktok.com/SHORT_ID/

💡 **Совет:** Копируйте ссылку через кнопку "Поделиться" в приложении TikTok
            `.trim(),
            keyboard: [
                [
                    { text: '🔙 Назад', callback_data: 'help_main' },
                ],
            ],
        },
        
        facebook: {
            text: `
📘 **Загрузка с Facebook**

**Поддерживаемый контент:**
• Публичные видео
• Видео из групп
• Reels
• Watch videos

**Как использовать:**
1. Отправьте ссылку на Facebook видео
2. Бот загрузит видео в лучшем качестве

**Примеры ссылок:**
• https://www.facebook.com/username/videos/VIDEO_ID/
• https://fb.watch/SHORT_ID/
• https://m.facebook.com/story.php?story_fbid=ID

💡 **Совет:** Для приватных видео могут потребоваться cookies
            `.trim(),
            keyboard: [
                [
                    { text: '🔙 Назад', callback_data: 'help_main' },
                ],
            ],
        },
        
        cookies: {
            text: `
🍪 **Настройка Cookies**

**Зачем нужны cookies:**
Некоторые сайты (Instagram, Facebook) требуют авторизацию для доступа к видео. Cookies позволяют боту использовать Ваш аккаунт.

**Как настроить:**

1️⃣ **Установите расширение:**
   • Chrome/Edge: "Get cookies.txt LOCALLY"
   • Firefox: "cookies.txt"

2️⃣ **Авторизуйтесь:**
   • Зайдите на Instagram.com или Facebook.com
   • Войдите в свой аккаунт

3️⃣ **Экспортируйте cookies:**
   • Нажмите на иконку расширения
   • Выберите формат "Netscape"
   • Скачайте файл cookies.txt

4️⃣ **Отправьте боту:**
   • Отправьте файл cookies.txt в чат с ботом
   • Бот сохранит и будет использовать cookies

⚠️ **Важно:**
• Cookies действительны 7 дней
• Не отправляйте cookies от важных аккаунтов
• Используйте отдельный аккаунт для безопасности
            `.trim(),
            keyboard: [
                [
                    { text: '🔙 Назад', callback_data: 'help_main' },
                ],
            ],
        },
        
        about: {
            text: `
👤 **О боте**

**Название:** Video Downloader & Music Bot
**Версия:** 2.0.0
**Разработчик:** G'ulomov Akmal

**Технологии:**
• Node.js + Telegraf
• yt-dlp для загрузки видео
• Playwright для сложных случаев
• Gemini AI для умных ответов

**Особенности:**
✅ Поддержка множества платформ
✅ Выбор качества видео
✅ Поиск музыки
✅ Умное кэширование
✅ Работа в группах

**Статистика:**
• Обработано запросов: {STATS}
• Загружено видео: {STATS}
• Найдено музыки: {STATS}

━━━━━━━━━━━━━━━━━━━━

💡 **Есть вопросы или предложения?**
Свяжитесь с разработчиком: @YOUR_USERNAME
            `.trim(),
            keyboard: [
                [
                    { text: '🔙 Назад', callback_data: 'start_back' },
                ],
            ],
        },
    };
    
    return helpMessages[category] || helpMessages.main;
};

// ============================================================================
// CALLBACK HANDLER
// ============================================================================

/**
 * Handle callback queries for start UI
 * @param {Object} ctx - Telegraf context
 * @param {string} data - Callback data
 */
const handleStartCallback = async (ctx, data) => {
    const chatId = ctx.chat.id;
    const messageId = ctx.callbackQuery.message.message_id;
    
    // Answer callback immediately
    await ctx.answerCbQuery();
    
    if (data === 'start_back') {
        // Return to start message
        const message = generateStartMessage(ctx.from);
        const keyboard = generateStartKeyboard();
        
        try {
            await ctx.editMessageText(message, {
                parse_mode: 'Markdown',
                ...keyboard,
            });
        } catch {}
        return;
    }
    
    if (data.startsWith('help_')) {
        const category = data.replace('help_', '');
        const help = getHelpMessage(category);
        
        try {
            await ctx.editMessageText(help.text, {
                parse_mode: 'Markdown',
                reply_markup: help.keyboard,
            });
        } catch {}
        return;
    }
    
    if (data === 'about_bot') {
        const help = getHelpMessage('about');
        
        // Get stats placeholder (replace with actual stats)
        const text = help.text.replace(/{STATS}/g, '0');
        
        try {
            await ctx.editMessageText(text, {
                parse_mode: 'Markdown',
                reply_markup: help.keyboard,
            });
        } catch {}
        return;
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Main functions
    generateStartMessage,
    generateStartKeyboard,
    getHelpMessage,
    
    // Callback handler
    handleStartCallback,
    
    // Constants
    BOT_USERNAME,
    GROUP_ADD_LINK,
};
