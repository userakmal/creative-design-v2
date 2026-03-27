/**
 * Advanced Features Integration Module
 * Integrates Start UI, Music Search, and Smart Caching into the bot
 * 
 * @author G'ulomov Akmal
 * @version 1.0.0
 */

const { Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Import modules
const {
    generateStartMessage,
    generateStartKeyboard,
    getHelpMessage,
    handleStartCallback,
    BOT_USERNAME,
} = require('./start-ui.cjs');

const {
    searchMusic,
    downloadAudio,
    generateMusicKeyboard,
    formatMusicResults,
    generateQueryId,
    storeMusicSearch,
    getMusicSearch,
} = require('./music-search.cjs');

const {
    cacheVideo,
    getCachedVideo,
    isVideoCached,
    getCacheStats,
    updateUserStats,
    getUserStats,
} = require('./database.cjs');

// ============================================================================
// START COMMAND HANDLER
// ============================================================================

/**
 * Setup /start command handler
 * @param {Object} bot - Telegraf bot instance
 */
const setupStartCommand = (bot) => {
    bot.start((ctx) => {
        updateUserStats(ctx.from.id, { messagesCount: true });
        
        const message = generateStartMessage(ctx.from);
        const keyboard = generateStartKeyboard();
        
        ctx.reply(message, {
            parse_mode: 'Markdown',
            ...keyboard,
        });
    });
    
    console.log('[AdvancedFeatures] ✅ Start command setup complete');
};

// ============================================================================
// CALLBACK QUERY HANDLER
// ============================================================================

/**
 * Setup callback query handlers for all features
 * @param {Object} bot - Telegraf bot instance
 */
const setupCallbackHandlers = (bot) => {
    bot.on('callback_query', async (ctx) => {
        const data = ctx.callbackQuery.data;
        
        // Handle Start UI callbacks
        if (data === 'start_back' || data.startsWith('help_') || data === 'about_bot') {
            await handleStartCallback(ctx, data);
            return;
        }
        
        // Handle Music Search callbacks
        if (data.startsWith('music_')) {
            await handleMusicCallback(ctx, data);
            return;
        }
        
        // Continue to other callback handlers (quality selection, etc.)
        // This allows multiple callback handlers to coexist
    });
    
    console.log('[AdvancedFeatures] ✅ Callback handlers setup complete');
};

// ============================================================================
// MUSIC SEARCH HANDLER
// ============================================================================

/**
 * Handle music search callback queries
 * @param {Object} ctx - Telegraf context
 * @param {string} data - Callback data
 */
const handleMusicCallback = async (ctx, data) => {
    const chatId = ctx.chat.id;
    const messageId = ctx.callbackQuery.message.message_id;
    const userId = ctx.from.id;
    
    await ctx.answerCbQuery();
    
    // Parse callback data: music_{queryId}_{index}_{videoId}
    const parts = data.split('_');
    if (parts.length < 4) {
        return;
    }
    
    const queryId = parts[1];
    const action = parts[2];
    
    // Handle cancel
    if (action === 'cancel') {
        try {
            await ctx.editMessageText('❌ Поиск отменён', {
                chat_id: chatId,
                message_id: messageId,
            });
        } catch {}
        return;
    }
    
    // Handle refresh
    if (action === 'refresh') {
        const search = getMusicSearch(queryId);
        if (!search) {
            await ctx.answerCbQuery('⏰ Результаты устарели', { show_alert: true });
            return;
        }
        
        const message = formatMusicResults(search.query, search.results);
        const keyboard = generateMusicKeyboard(search.results, queryId);
        
        try {
            await ctx.editMessageText(message, {
                parse_mode: 'Markdown',
                ...keyboard,
            });
        } catch {}
        return;
    }
    
    // Handle download selection
    const index = parseInt(action);
    const search = getMusicSearch(queryId);
    
    if (!search || !search.results[index]) {
        await ctx.answerCbQuery('⏰ Результаты устарели', { show_alert: true });
        return;
    }
    
    // Verify user
    if (search.userId !== userId) {
        await ctx.answerCbQuery('⚠️ Это не Ваш запрос', { show_alert: true });
        return;
    }
    
    const selectedTrack = search.results[index];
    
    // Show loading message
    const loadingMsg = await ctx.reply('📥 **Загрузка аудио...**\n\n⏳ Пожалуйста, подождите...', {
        parse_mode: 'Markdown',
    });
    
    try {
        // Download audio
        const outputPath = path.join(__dirname, 'local-video-api', `music_${Date.now()}.mp3`);
        const result = await downloadAudio(selectedTrack.url, outputPath);
        
        if (result.success && fs.existsSync(outputPath)) {
            // Check file size
            const stats = fs.statSync(outputPath);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
            
            if (stats.size > 50 * 1024 * 1024) {
                await ctx.editMessageText(
                    loadingMsg.message_id,
                    null,
                    '⚠️ Файл слишком большой для Telegram (макс. 50MB)'
                );
                fs.unlinkSync(outputPath);
                return;
            }
            
            // Send audio file
            await ctx.replyWithAudio(
                { source: outputPath },
                {
                    title: selectedTrack.title,
                    performer: selectedTrack.artist,
                    caption: `🎵 ${selectedTrack.title}\n🎤 ${selectedTrack.artist}\n📦 ${fileSizeMB} MB\n\n🤖 @${BOT_USERNAME}`,
                }
            );
            
            // Cleanup
            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }, 60000);
            
            // Update stats
            updateUserStats(userId, { videosDownloaded: true });
            
        } else {
            await ctx.editMessageText(
                loadingMsg.message_id,
                null,
                `❌ Ошибка загрузки: ${result.error || 'Неизвестная ошибка'}`
            );
        }
    } catch (error) {
        console.error('[MusicCallback] Error:', error.message);
        await ctx.editMessageText(
            loadingMsg.message_id,
            null,
            `❌ Ошибка: ${error.message}`
        );
    }
};

// ============================================================================
// MESSAGE HANDLER (Music Search)
// ============================================================================

/**
 * Setup music search message handler
 * @param {Object} bot - Telegraf bot instance
 */
const setupMusicSearchHandler = (bot) => {
    bot.on('text', async (ctx, next) => {
        const text = ctx.message.text.trim();
        
        // Skip commands
        if (text.startsWith('/')) {
            return next();
        }
        
        // Skip URLs (handled by video downloader)
        if (text.startsWith('http')) {
            return next();
        }
        
        // Skip very short messages
        if (text.length < 3) {
            return next();
        }
        
        // Check if it looks like a song search query
        // (contains common music-related keywords or is a short phrase)
        const musicKeywords = [
            'song', 'песня', 'music', 'музыка', 'трек', 'audio',
            'слушать', 'download', 'скачать', 'official', 'clip',
            'клип', 'mp3', 'audio', 'звук', 'мелодия'
        ];
        
        const isMusicQuery = musicKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        ) || text.length < 100;  // Short queries are likely music searches
        
        if (!isMusicQuery) {
            return next();
        }
        
        // Show typing action
        await ctx.sendChatAction('typing');
        
        // Search for music
        const waitMsg = await ctx.reply('🔍 **Поиск музыки...**\n\n⏳ Пожалуйста, подождите...', {
            parse_mode: 'Markdown',
        });
        
        try {
            const results = await searchMusic(text);
            
            if (!results || results.length === 0) {
                await ctx.editMessageText(
                    waitMsg.message_id,
                    null,
                    '❌ Ничего не найдено. Попробуйте другой запрос.'
                );
                return;
            }
            
            // Generate query ID and store search
            const queryId = generateQueryId();
            storeMusicSearch(queryId, {
                query: text,
                results,
                userId: ctx.from.id,
                chatId: ctx.chat.id,
            });
            
            // Format and send results
            const message = formatMusicResults(text, results);
            const keyboard = generateMusicKeyboard(results, queryId);
            
            await ctx.editMessageText(
                waitMsg.message_id,
                null,
                message,
                {
                    parse_mode: 'Markdown',
                    ...keyboard,
                }
            );
            
            // Update stats
            updateUserStats(ctx.from.id, { musicSearched: true });
            
        } catch (error) {
            console.error('[MusicSearch] Error:', error.message);
            await ctx.editMessageText(
                waitMsg.message_id,
                null,
                `❌ Ошибка поиска: ${error.message}`
            );
        }
    });
    
    console.log('[AdvancedFeatures] ✅ Music search handler setup complete');
};

// ============================================================================
// AUDIO/VOICE MESSAGE HANDLER
// ============================================================================

/**
 * Setup audio/voice message handler for music recognition
 * @param {Object} bot - Telegraf bot instance
 */
const setupAudioHandler = (bot) => {
    bot.on('audio', async (ctx) => {
        await ctx.reply('🎵 **Распознавание музыки...**\n\n⏳ Анализирую аудио файл...', {
            parse_mode: 'Markdown',
        });
        
        // Note: Full audio fingerprint recognition requires ACRCloud API
        // For now, we'll extract metadata and search by title
        
        const audio = ctx.message.audio;
        
        if (audio.title || audio.performer) {
            const query = `${audio.performer || ''} ${audio.title || ''}`.trim();
            
            if (query) {
                await ctx.reply(`🔍 Поиск по метаданным: **${query}**`, {
                    parse_mode: 'Markdown',
                });
                
                // Search for the song
                const results = await searchMusic(query);
                
                if (results && results.length > 0) {
                    const queryId = generateQueryId();
                    storeMusicSearch(queryId, {
                        query,
                        results,
                        userId: ctx.from.id,
                        chatId: ctx.chat.id,
                    });
                    
                    const message = formatMusicResults(query, results);
                    const keyboard = generateMusicKeyboard(results, queryId);
                    
                    await ctx.reply(message, {
                        parse_mode: 'Markdown',
                        ...keyboard,
                    });
                    return;
                }
            }
        }
        
        await ctx.reply('❌ Не удалось распознать трек по метаданным.\n\n💡 Попробуйте отправить название песни текстом.');
    });
    
    bot.on('voice', async (ctx) => {
        await ctx.reply('🎤 **Голосовое сообщение получено**\n\n⚠️ Распознавание голосовых сообщений требует дополнительной настройки API (ACRCloud).\n\n💡 Пожалуйста, отправьте название песни текстом.');
    });
    
    console.log('[AdvancedFeatures] ✅ Audio handler setup complete');
};

// ============================================================================
// SMART CACHING FOR VIDEOS
// ============================================================================

/**
 * Get cached video or mark for caching after download
 * @param {string} url - Video URL
 * @returns {Object|null} Cached video data or null
 */
const getCachedOrMarkForCache = (url) => {
    // Check if already cached
    const cached = getCachedVideo(url);
    
    if (cached) {
        console.log(`[SmartCache] ✅ Cache hit: ${url}`);
        return cached;
    }
    
    console.log(`[SmartCache] ⏳ Cache miss: ${url}`);
    return null;
};

/**
 * Cache video after successful download
 * @param {string} url - Video URL
 * @param {Object} videoData - Video data { fileId, fileSize, title, quality, duration }
 */
const cacheDownloadedVideo = (url, videoData) => {
    cacheVideo(url, videoData);
    console.log(`[SmartCache] 💾 Cached: ${url}`);
};

// ============================================================================
// CACHE MANAGEMENT COMMANDS
// ============================================================================

/**
 * Setup cache management commands
 * @param {Object} bot - Telegraf bot instance
 */
const setupCacheCommands = (bot) => {
    // Cache stats command (admin only)
    bot.command('cachestats', async (ctx) => {
        if (ctx.from.id !== parseInt(process.env.ADMIN_ID || '853691902')) {
            return;
        }
        
        const stats = getCacheStats();
        
        const message = `
💾 **Статистика кэша**

📊 **Всего видео:** ${stats.totalVideos}
💿 **Общий размер:** ${stats.totalSize}
⬇️ **Скачано из кэша:** ${stats.totalDownloads}
        `.trim();
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    });
    
    // Clear cache command (admin only)
    bot.command('clearcache', async (ctx) => {
        if (ctx.from.id !== parseInt(process.env.ADMIN_ID || '853691902')) {
            return;
        }
        
        const { clearAllCache } = require('./database.cjs');
        clearAllCache();
        
        await ctx.reply('✅ Кэш очищен');
    });
    
    // User stats command
    bot.command('mystats', async (ctx) => {
        const stats = getUserStats(ctx.from.id);
        
        if (!stats) {
            await ctx.reply('📊 Ваша статистика пока пуста.\n\nИспользуйте бота, чтобы увидеть статистику!');
            return;
        }
        
        const message = `
📊 **Ваша статистика**

📝 **Сообщений:** ${stats.messagesCount}
📥 **Скачано видео:** ${stats.videosDownloaded}
🎵 **Поисков музыки:** ${stats.musicSearched}
📅 **Первое использование:** ${new Date(stats.firstUsed).toLocaleDateString('ru-RU')}
🕒 **Последняя активность:** ${new Date(stats.lastActive).toLocaleDateString('ru-RU')}
        `.trim();
        
        await ctx.reply(message, { parse_mode: 'Markdown' });
    });
    
    console.log('[AdvancedFeatures] ✅ Cache commands setup complete');
};

// ============================================================================
// INTEGRATION FUNCTION
// ============================================================================

/**
 * Initialize all advanced features
 * @param {Object} bot - Telegraf bot instance
 */
const initAdvancedFeatures = (bot) => {
    console.log('\n🚀 Initializing Advanced Features...\n');
    
    setupStartCommand(bot);
    setupCallbackHandlers(bot);
    setupMusicSearchHandler(bot);
    setupAudioHandler(bot);
    setupCacheCommands(bot);
    
    console.log('\n✅ All Advanced Features initialized!\n');
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Main initialization
    initAdvancedFeatures,
    
    // Individual setup functions (for modular use)
    setupStartCommand,
    setupCallbackHandlers,
    setupMusicSearchHandler,
    setupAudioHandler,
    setupCacheCommands,
    
    // Caching helpers
    getCachedOrMarkForCache,
    cacheDownloadedVideo,
    
    // Constants
    BOT_USERNAME,
};
