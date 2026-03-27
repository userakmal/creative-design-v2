/**
 * Telegram Video Downloader Bot - Senior-level Refactored Version
 * Improved error handling, code organization, and maintainability
 * 
 * @author G'ulomov Akmal
 * @version 2.0.0
 */

const { Telegraf } = require('telegraf');
const { Markup } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import from refactored server
const {
    downloadWithYtDlp,
    sniffWithPlaywright,
    getVideoFormats,
    isM3U8,
    isDirectVideo,
    getYtDlpPath,
    getRotatedUserAgent,
    AUTHOR,
} = require('./local-video-api/server');

// Import advanced features
const {
    initAdvancedFeatures,
    getCachedOrMarkForCache,
    cacheDownloadedVideo,
} = require('./advanced-features');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso',
    ADMIN_ID: parseInt(process.env.ADMIN_ID || '853691902', 10),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    DOWNLOAD_TIMEOUT: 300000, // 5 minutes (increased from 3 minutes)
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    USERS_FILE: path.join(__dirname, 'data', 'users.json'),
    TEMP_DIR: path.join(__dirname, 'local-video-api'),
    QUALITY_SELECTION_TIMEOUT: 120000, // 2 minutes to select quality
};

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-pro'];

// ============================================================================
// ENVIRONMENT LOADING
// ============================================================================

const loadEnv = () => {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envData = fs.readFileSync(envPath, 'utf8');
        envData.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
};

loadEnv();

// ============================================================================
// USER MANAGEMENT
// ============================================================================

const loadUsers = () => {
    try {
        if (!fs.existsSync(CONFIG.USERS_FILE)) {
            return [];
        }
        const data = fs.readFileSync(CONFIG.USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[UserManager] Failed to load users:', error.message);
        return [];
    }
};

const saveUser = (id) => {
    try {
        let users = loadUsers();
        if (!users.includes(id)) {
            users.push(id);
            
            if (!fs.existsSync(path.dirname(CONFIG.USERS_FILE))) {
                fs.mkdirSync(path.dirname(CONFIG.USERS_FILE), { recursive: true });
            }
            
            fs.writeFileSync(CONFIG.USERS_FILE, JSON.stringify(users, null, 2));
        }
    } catch (error) {
        console.error('[UserManager] Failed to save user:', error.message);
    }
};

// ============================================================================
// FILE UTILITIES
// ============================================================================

const safeUnlink = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('[FileSystem] Failed to delete:', filePath, error.message);
        return false;
    }
};

const cleanupDownloadArtifacts = (basePath) => {
    const extensions = ['.part', '.ytdl', '.tmp', '.download'];
    
    safeUnlink(basePath);
    extensions.forEach(ext => safeUnlink(basePath + ext));
};

const sanitizeFilename = (filename, maxLength = 50) => {
    return filename
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\.\./g, '')
        .substring(0, maxLength) || 'video';
};

const formatFileSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
};

// ============================================================================
// QUALITY SELECTION HELPERS
// ============================================================================

/**
 * Generate inline keyboard for quality selection
 * @param {Array} formats - Array of format objects
 * @param {string} urlId - Unique URL identifier for callback
 * @returns {Markup}
 */
const generateQualityKeyboard = (formats, urlId) => {
    const keyboard = [];
    
    // Video qualities (2 buttons per row)
    const videoFormats = formats.filter(f => f.hasVideo);
    
    for (let i = 0; i < videoFormats.length; i += 2) {
        const row = [];
        for (let j = 0; j < 2 && i + j < videoFormats.length; j++) {
            const format = videoFormats[i + j];
            const label = `${format.resolution} ${format.filesize !== '?' ? `(${format.filesize}MB)` : ''}`;
            row.push({
                text: label,
                callback_data: `quality_${urlId}_${format.format_id}_${format.order}`,
            });
        }
        keyboard.push(row);
    }
    
    // Audio only formats (1 row)
    const audioFormats = formats.filter(f => !f.hasVideo && f.hasAudio);
    if (audioFormats.length > 0) {
        if (keyboard.length > 0) {
            keyboard.push([{ text: '🎵 Audio Only', callback_data: 'separator' }]);
        }
        const audioRow = [];
        for (let i = 0; i < Math.min(audioFormats.length, 4); i++) {
            const format = audioFormats[i];
            audioRow.push({
                text: `${format.acodec} ${format.filesize !== '?' ? `(${format.filesize}MB)` : ''}`,
                callback_data: `quality_${urlId}_${format.format_id}_${format.order}`,
            });
        }
        keyboard.push(audioRow);
    }
    
    // Cancel button
    keyboard.push([{ text: '❌ Bekor qilish', callback_data: `cancel_${urlId}` }]);
    
    return Markup.inlineKeyboard(keyboard);
};

/**
 * Format video info message
 * @param {Object} videoInfo - Video information
 * @returns {string}
 */
const formatVideoInfo = (videoInfo) => {
    const { title, duration, formats, uploader } = videoInfo;
    
    const videoCount = formats.filter(f => f.hasVideo).length;
    const audioCount = formats.filter(f => !f.hasVideo && f.hasAudio).length;
    
    const bestVideo = formats.find(f => f.hasVideo);
    const bestQuality = bestVideo ? bestVideo.resolution : 'N/A';
    
    let message = `🎬 **Video Topildi**\n\n`;
    message += `📌 **Nomi:** ${title.substring(0, 100)}${title.length > 100 ? '...' : ''}\n`;
    
    if (uploader) {
        message += `👤 **Muallif:** ${uploader}\n`;
    }
    
    if (duration) {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        message += `⏱ **Davomiyligi:** ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
    }
    
    message += `\n📊 **Sifat tanlovi:**\n`;
    message += `• Video: ${videoCount} ta variant\n`;
    message += `• Audio: ${audioCount} ta variant\n`;
    message += `• Eng yaxshi sifat: ${bestQuality}\n\n`;
    message += `⬇️ **Kerakli sifatni tanlang:**`;
    
    return message;
};

/**
 * Generate unique URL ID for callback tracking
 * @param {string} url
 * @returns {string}
 */
const generateUrlId = (url) => {
    return Buffer.from(url).toString('base64').substring(0, 12);
};

/**
 * Decode URL from ID
 * @param {string} urlId
 * @returns {string}
 */
const decodeUrlId = (urlId) => {
    try {
        return Buffer.from(urlId, 'base64').toString('utf-8');
    } catch {
        return null;
    }
};

// Store for pending quality selections (urlId -> {url, formats, message})
const qualitySelections = new Map();

// ============================================================================
// STARTUP CLEANUP
// ============================================================================

const performStartupCleanup = () => {
    console.log('[Bot] Cleaning up temporary files from previous sessions...');
    
    if (fs.existsSync(CONFIG.TEMP_DIR)) {
        fs.readdirSync(CONFIG.TEMP_DIR).forEach(file => {
            if (file.startsWith('bot_download_')) {
                cleanupDownloadArtifacts(path.join(CONFIG.TEMP_DIR, file));
            }
        });
    }
};

performStartupCleanup();

// ============================================================================
// GEMINI AI SETUP
// ============================================================================

let geminiModel = null;

const initializeGemini = async () => {
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        console.warn('[Gemini] API key not configured. AI features disabled.');
        return;
    }
    
    const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
    
    console.log('[Gemini] Discovering available models...');
    
    for (const modelName of GEMINI_MODELS) {
        try {
            const testModel = genAI.getGenerativeModel({ model: modelName });
            const result = await testModel.generateContent('ping');
            await result.response;
            
            console.log(`[Gemini] ✅ Model ready: ${modelName}`);
            geminiModel = testModel;
            return;
        } catch (error) {
            const errorMsg = error.message.toLowerCase();
            
            if (errorMsg.includes('429') && (errorMsg.includes('limit: 0') || errorMsg.includes('quota'))) {
                console.warn(`[Gemini] ⚠️ ${modelName}: Quota exceeded (API key may be blocked)`);
                continue;
            } else if (errorMsg.includes('429')) {
                console.log(`[Gemini] ✅ ${modelName}: Available (rate limited)`);
                geminiModel = genAI.getGenerativeModel({ model: modelName });
                return;
            } else if (errorMsg.includes('403')) {
                console.warn(`[Gemini] ❌ ${modelName}: Access denied (403)`);
            } else if (errorMsg.includes('404')) {
                console.warn(`[Gemini] ⚠️ ${modelName}: Not found (404)`);
            } else {
                console.warn(`[Gemini] ⚠️ ${modelName}: ${error.message.split('\n')[0]}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.error('[Gemini] ❌ No models available. AI features disabled.');
    console.log('[Gemini] 💡 Tip: Create a new project in AI Studio and get a fresh API key.');
};

initializeGemini();

// ============================================================================
// BOT INITIALIZATION
// ============================================================================

console.log('🚀 Telegram Bot v2.0.0 starting...');

const bot = new Telegraf(CONFIG.BOT_TOKEN);

// ============================================================================
// BOT COMMANDS
// ============================================================================

// Advanced Features will handle /start command
// Initialize advanced features (Start UI, Music Search, Smart Caching)
initAdvancedFeatures(bot);

// Keep existing commands
bot.command('myid', (ctx) => {
    ctx.reply(`Sizning Telegram ID raqamingiz: <code>${ctx.from.id}</code>`, { parse_mode: 'HTML' });
});

bot.command(['stats', 'stars'], (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) return;
    
    const users = loadUsers();
    ctx.reply(`📊 Bot statistikasi:\n\n👥 Foydalanuvchilar: ${users.length} ta`);
});

bot.command('cookies', (ctx) => {
    ctx.reply(
        `🍪 <b>Instagram va ijtimoiy tarmoqlar uchun Cookies sozlash</b>\n\n` +
        `Agar videolar yuklanmasa, quyidagi amallarni bajaring:\n\n` +
        `1. Brauzeringizga (Chrome/Edge) <b>"Get cookies.txt LOCALLY"</b> kengaytmasini o'rnating.\n` +
        `2. Instagram.com saytiga kiring va profilingizga kiring.\n` +
        `3. Kengaytma orqali kukilarni <b>Netscape</b> formatida eksport qiling.\n` +
        `4. Faylni <code>cookies.txt</code> deb nomlang va bot papkasiga tashlang.\n\n` +
        `💡 Bu amallar botga sizning nomingizdan video ko'rish va yuklash imkonini beradi.`,
        { parse_mode: 'HTML' }
    );
});

bot.command('send', async (ctx) => {
    if (ctx.from.id !== CONFIG.ADMIN_ID) return;
    
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) {
        return ctx.reply('Iltimos, reklama matnini yozing. Masalan: /send Salom barchaga');
    }
    
    const users = loadUsers();
    let count = 0;
    let blocked = 0;
    
    const waitMsg = await ctx.reply(`📣 Reklama ${users.length} ta foydalanuvchiga yuborilmoqda...`);
    
    for (const userId of users) {
        try {
            await bot.telegram.sendMessage(userId, message);
            count++;
        } catch (error) {
            if (error.description && error.description.includes('bot was blocked')) {
                blocked++;
            }
        }
    }
    
    await bot.telegram.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        null,
        `✅ Reklama yakunlandi!\n\n👤 Qabul qildi: ${count}\n🚫 Bloklagan: ${blocked}`
    );
});

// ============================================================================
// VIDEO DOWNLOAD HANDLER - With Quality Selection
// ============================================================================

bot.on('text', async (ctx, next) => {
    saveUser(ctx.from.id);
    const url = ctx.message.text.trim();

    // Skip if not a URL
    if (!url.startsWith('http')) {
        return next();
    }

    const waitMsg = await ctx.reply('🔍 Video ma\'lumotlari olinmoqda, iltimos kuting...');
    
    try {
        // Validate yt-dlp first
        const ytcmd = getYtDlpPath();
        
        try {
            const { execSync } = require('child_process');
            execSync(`"${ytcmd}" --version`, { stdio: 'pipe' });
        } catch (err) {
            console.error('[Bot] ❌ yt-dlp not working!');
            await bot.telegram.editMessageText(
                ctx.chat.id,
                waitMsg.message_id,
                null,
                '❌ yt-dlp o\'rnatilmagan!\n\n' +
                'Yechim:\n' +
                '1. Python o\'rnating: https://python.org\n' +
                '2. Terminalda yozing: pip install yt-dlp\n\n' +
                'Yoki: https://github.com/yt-dlp/yt-dlp/releases dan .exe faylni yuklab oling'
            );
            return;
        }

        // For direct video URLs, skip quality selection
        if (isDirectVideo(url) || isM3U8(url)) {
            console.log('[Bot] Direct video URL detected - downloading automatically');
            await downloadVideo(ctx, url, null, waitMsg);
            return;
        }

        // Get video formats
        console.log('[Bot] Fetching video formats...');
        const videoInfo = await getVideoFormats(url);
        
        if (!videoInfo || !videoInfo.formats || videoInfo.formats.length === 0) {
            throw new Error('Video formatlari topilmadi');
        }

        console.log(`[Bot] Found ${videoInfo.formats.length} formats`);

        // Generate unique ID for this URL
        const urlId = generateUrlId(url);
        
        // Store selection info
        qualitySelections.set(urlId, {
            url,
            videoInfo,
            chatId: ctx.chat.id,
            userId: ctx.from.id,
            timestamp: Date.now(),
        });

        // Format message
        const caption = formatVideoInfo(videoInfo);
        
        // Generate inline keyboard
        const keyboard = generateQualityKeyboard(videoInfo.formats, urlId);

        // Edit or send message with quality selection
        try {
            await bot.telegram.editMessageText(
                ctx.chat.id,
                waitMsg.message_id,
                null,
                caption,
                {
                    parse_mode: 'Markdown',
                    ...keyboard,
                }
            );
        } catch (editError) {
            // If edit fails, send new message
            await ctx.reply(caption, {
                parse_mode: 'Markdown',
                ...keyboard,
            });
        }

        // Auto-cleanup after timeout
        setTimeout(() => {
            qualitySelections.delete(urlId);
        }, CONFIG.QUALITY_SELECTION_TIMEOUT);

    } catch (error) {
        console.error('[Bot] ❌ Error:', error.message);
        
        try {
            await bot.telegram.editMessageText(
                ctx.chat.id,
                waitMsg.message_id,
                null,
                `❌ Xatolik: ${error.message}`
            );
        } catch {
            await ctx.reply(`❌ Xatolik: ${error.message}`);
        }
    }
});

// ============================================================================
// CALLBACK QUERY HANDLER (Quality Selection)
// ============================================================================

bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;
    const messageId = ctx.callbackQuery.message.message_id;

    console.log('[Callback] Received:', data);

    // Answer callback query immediately
    await ctx.answerCbQuery();

    // Handle separator (do nothing)
    if (data === 'separator') {
        return;
    }

    // Handle cancel
    if (data.startsWith('cancel_')) {
        const urlId = data.replace('cancel_', '');
        qualitySelections.delete(urlId);
        
        try {
            await bot.telegram.editMessageText(
                chatId,
                messageId,
                null,
                '❌ Bekor qilindi'
            );
        } catch {}
        return;
    }

    // Handle quality selection: quality_{urlId}_{formatId}_{order}
    if (data.startsWith('quality_')) {
        const parts = data.split('_');
        if (parts.length < 4) {
            await ctx.answerCbQuery('⚠️ Xato: format ID topilmadi', { show_alert: true });
            return;
        }

        const urlId = parts[1];
        const formatId = parts[2];
        // const order = parts[3]; // Not used but available

        // Get selection info
        const selection = qualitySelections.get(urlId);
        
        if (!selection) {
            await ctx.answerCbQuery('⏰ Vaqt tugadi. Iltimos, havolani qayta yuboring', { show_alert: true });
            return;
        }

        // Verify user
        if (selection.userId !== userId) {
            await ctx.answerCbQuery('⚠️ Bu sizning tanlovingiz emas', { show_alert: true });
            return;
        }

        const { url, videoInfo } = selection;
        
        // Find the selected format
        const format = videoInfo.formats.find(f => f.format_id === formatId);
        
        if (!format) {
            await ctx.answerCbQuery('⚠️ Format topilmadi', { show_alert: true });
            return;
        }

        // Remove selection
        qualitySelections.delete(urlId);

        // Show loading message
        const loadingMsg = await ctx.reply(
            `📥 Yuklanmoqda...\n\n` +
            `🎬 **${videoInfo.title.substring(0, 50)}**\n` +
            `📊 **Sifat:** ${format.resolution}\n` +
            `💾 **Hajmi:** ${format.filesize} MB\n\n` +
            `⏳ Kutib turing...`,
            { parse_mode: 'Markdown' }
        );

        try {
            // Download the video with selected format
            await downloadVideo(ctx, url, formatId, loadingMsg);
            
            // Delete loading message after successful download
            try {
                await bot.telegram.deleteMessage(chatId, loadingMsg.message_id);
            } catch {}
        } catch (error) {
            console.error('[Download] Error:', error.message);
            
            try {
                await bot.telegram.editMessageText(
                    chatId,
                    loadingMsg.message_id,
                    null,
                    `❌ Xatolik: ${error.message}`
                );
            } catch {}
        }

        return;
    }
});

// ============================================================================
// VIDEO DOWNLOAD FUNCTION
// ============================================================================

/**
 * Download video with specific format
 * @param {Context} ctx - Telegraf context
 * @param {string} url - Video URL
 * @param {string} formatId - Format ID to download (null for auto)
 * @param {Message} waitMsg - Loading message to edit
 */
const downloadVideo = async (ctx, url, formatId = null, waitMsg) => {
    // Check cache first
    const cached = getCachedOrMarkForCache(url);
    
    if (cached) {
        // Send cached video immediately
        console.log(`[Download] 🚀 Sending cached video: ${cached.fileId}`);
        
        try {
            await bot.telegram.editMessageText(
                ctx.chat.id,
                waitMsg.message_id,
                null,
                '✅ **Найдено в кэше!** Отправка...\n\n⚡ Мгновенная загрузка!',
                { parse_mode: 'Markdown' }
            );
            
            await ctx.replyWithVideo(
                cached.fileId,
                {
                    caption: `🎬 ${cached.title}\n📦 Hajmi: ${cached.fileSize}\n\n🤖 @${ctx.botInfo.username} orqali yuklab olindi`,
                }
            );
            
            console.log('[Download] ✅ Sent from cache');
            return;
        } catch (error) {
            console.error('[Download] Cache send error:', error.message);
            // If cache fails, continue with normal download
        }
    }
    
    // Continue with normal download
    const outputPath = path.join(CONFIG.TEMP_DIR, `bot_download_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.mp4`);
    let childProcess = null;

    try {
        // Ensure temp directory exists
        if (!fs.existsSync(CONFIG.TEMP_DIR)) {
            fs.mkdirSync(CONFIG.TEMP_DIR, { recursive: true });
        }

        const ytcmd = getYtDlpPath();
        const userAgent = getRotatedUserAgent();

        // Build yt-dlp arguments
        const args = [
            '--no-check-certificates',
            '--user-agent', userAgent,
            '--no-playlist',
            '--geo-bypass',
            '--no-continue',
            '--force-overwrites',
            '-o', outputPath,
        ];

        // Add format selection if specified
        if (formatId) {
            args.push('-f', `${formatId}+bestaudio[ext=m4a]/${formatId}`);
            console.log(`[Download] Using format: ${formatId}`);
        } else {
            args.push('-f', 'best[ext=mp4]/best');
        }

        // Add referer
        try {
            const domain = new URL(url).hostname;
            args.push('--referer', `https://${domain}/`);
        } catch {
            args.push('--referer', url);
        }

        // Cookie support
        const cookiesPath = path.join(__dirname, 'cookies.txt');
        const apiCookiesPath = path.join(__dirname, 'local-video-api', 'cookies.txt');

        if (fs.existsSync(cookiesPath)) {
            args.push('--cookies', cookiesPath);
            console.log('[Download] Using cookies');
        } else if (fs.existsSync(apiCookiesPath)) {
            args.push('--cookies', apiCookiesPath);
            console.log('[Download] Using cookies');
        }

        args.push(url);

        console.log(`[Download] Starting: ${url.substring(0, 100)}...`);
        console.log(`[Download] Output: ${outputPath}`);

        childProcess = spawn(ytcmd, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
        });

        let downloadProgress = '';
        let errorMessage = '';
        let lastProgressUpdate = 0;

        // Capture stdout for progress
        childProcess.stdout.on('data', (data) => {
            const line = data.toString();
            downloadProgress += line;
            
            // Extract progress percentage
            const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%/);
            if (progressMatch) {
                const percent = Math.round(parseFloat(progressMatch[1]));
                
                // Throttle updates to once per second
                const now = Date.now();
                if (now - lastProgressUpdate > 1000) {
                    bot.telegram.editMessageText(
                        ctx.chat.id,
                        waitMsg.message_id,
                        null,
                        `📥 Yuklanmoqda... ${percent}%\n\n` +
                        `⏳ Kutib turing...`,
                        { parse_mode: 'Markdown' }
                    ).catch(() => {});
                    lastProgressUpdate = now;
                }
            }
        });

        // Capture stderr for errors
        childProcess.stderr.on('data', (data) => {
            const line = data.toString();
            errorMessage += line;
            console.log(`[Download] yt-dlp: ${line.trim()}`);
        });

        // Timeout handler
        const timeout = setTimeout(() => {
            if (childProcess && !childProcess.killed) {
                childProcess.kill('SIGKILL');
                console.log('[Download] ⏰ Timeout');
            }
        }, CONFIG.DOWNLOAD_TIMEOUT);

        childProcess.on('close', async (code) => {
            clearTimeout(timeout);
            console.log(`[Download] Process exited: ${code}`);

            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    const stats = fs.statSync(outputPath);
                    const fileSize = formatFileSize(stats.size);
                    console.log(`[Download] ✅ Downloaded: ${fileSize}`);

                    // Check file size limit
                    if (stats.size > CONFIG.MAX_FILE_SIZE) {
                        await bot.telegram.editMessageText(
                            ctx.chat.id,
                            waitMsg.message_id,
                            null,
                            `⚠️ Video hajmi ${fileSize}. Telegram cheklovi (50MB) dan oshadi, lekin urinib ko'raman...`
                        );
                    }

                    await bot.telegram.editMessageText(
                        ctx.chat.id,
                        waitMsg.message_id,
                        null,
                        '✅ Yuklandi! Telegramga yuborilmoqda...'
                    );

                    await ctx.replyWithVideo(
                        { source: outputPath },
                        {
                            caption: `🎬 Video\n📦 Hajmi: ${fileSize}\n\n🤖 @${ctx.botInfo.username} orqali yuklab olindi`,
                        }
                    );

                    // Cache the video (get file_id from the sent message)
                    // Note: We need to get the file_id after sending
                    console.log('[Download] ✅ Video sent successfully');
                    
                    // Note: File_id caching would require getting the file_id from the sent message
                    // For now, we cache the metadata
                    cacheDownloadedVideo(url, {
                        fileId: outputPath,  // This will be updated when we get the actual file_id
                        fileSize: stats.size,
                        title: videoInfo?.title || 'Video',
                        quality: formatId || 'best',
                        duration: videoInfo?.duration,
                    });
                } catch (sendError) {
                    console.error('[Download] ❌ Send failed:', sendError.message);

                    let errorMsg = '❌ Xatolik: Videoni yuborib bo\'lmadi.';
                    
                    if (sendError.message.includes('Request Entity Too Large') || 
                        sendError.message.includes('FILE_TOO_LARGE')) {
                        errorMsg += ' Video hajmi juda katta (50MB dan oshdi).';
                    } else if (sendError.message) {
                        errorMsg += ' ' + sendError.message.split('\n')[0];
                    }

                    await ctx.reply(errorMsg);
                } finally {
                    // Cleanup after 1 minute
                    setTimeout(() => {
                        cleanupDownloadArtifacts(outputPath);
                        console.log('[Download] 🧹 Cleaned up');
                    }, 60000);
                }
            } else {
                // Download failed
                cleanupDownloadArtifacts(outputPath);
                console.log(`[Download] ❌ Failed. Code: ${code}`);

                let failMsg = '❌ Videoni yuklab bo\'lmadi.';
                
                if (errorMessage.includes('HTTP Error 403')) {
                    failMsg += '\n\n⚠️ 403 Forbidden - Sayt ruxsat bermadi.\n💡 /cookies buyrug\'ini ko\'ring.';
                } else if (errorMessage.includes('HTTP Error 404')) {
                    failMsg += '\n\n⚠️ 404 Not Found - Video topilmadi.';
                } else if (errorMessage.includes('timeout')) {
                    failMsg += '\n\n⏰ Vaqt tugadi.';
                }

                if (url.includes('instagram.com') || url.includes('tiktok.com')) {
                    failMsg += '\n\n💡 Instagram/TikTok uchun: /cookies buyrug\'ini ko\'ring.';
                }

                await ctx.reply(failMsg);
            }
        });

    } catch (error) {
        console.error('[Download] ❌ Error:', error.message);
        
        if (outputPath) {
            cleanupDownloadArtifacts(outputPath);
        }

        await ctx.reply(`❌ Xatolik: ${error.message}`);
    }
};

// ============================================================================
// GEMINI AI HANDLER
// ============================================================================

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    // Skip commands
    if (text.startsWith('/')) {
        return;
    }
    
    // Check if Gemini is available
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        return ctx.reply('⚠️ Gemini AI kaliti o\'rnatilmagan. Iltimos, admin bilan bog\'laning.');
    }
    
    if (!geminiModel) {
        return ctx.reply('⏳ AI tizimi hali tayyor emas. Ozroq kuting yoki admin bilan bog\'laning.');
    }
    
    try {
        await ctx.sendChatAction('typing');
        
        const result = await geminiModel.generateContent(text);
        const response = await result.response;
        const replyText = response.text();
        
        try {
            // Try Markdown first
            await ctx.reply(replyText, { parse_mode: 'Markdown' });
        } catch (formatError) {
            if (formatError.message && formatError.message.includes('can\'t parse entities')) {
                console.warn('[Bot] Markdown parse error, sending as plain text...');
                await ctx.reply(replyText);
            } else {
                throw formatError;
            }
        }
        
    } catch (error) {
        console.error('[Gemini] Error:', error.message);
        
        let errorMessage = '❌ AI xatosi: ' + error.message;
        
        if (error.message.includes('can\'t parse entities')) {
            errorMessage = '❌ Formatlash xatosi. Javobni to\'g\'ri ko\'rsatib bo\'lmadi.';
        }
        
        ctx.reply(errorMessage + '\n\n💡 Maslahat: Model yoki API kalit bilan muammo bo\'lishi mumkin.');
    }
});

// ============================================================================
// BOT LIFECYCLE
// ============================================================================

console.log('... Bot ma\'lumotlari tekshirilmoqda');

// Validate yt-dlp installation
const validateYtDlp = () => {
    const ytcmd = getYtDlpPath();
    try {
        const { execSync } = require('child_process');
        execSync(`"${ytcmd}" --version`, { stdio: 'ignore' });
        console.log('[Bot] ✅ yt-dlp installed');
        return true;
    } catch (error) {
        console.error('[Bot] ❌ yt-dlp NOT FOUND! Please install:');
        console.error('       pip install yt-dlp');
        console.error('       OR download from: https://github.com/yt-dlp/yt-dlp/releases');
        return false;
    }
};

const ytDlpReady = validateYtDlp();

bot.telegram.getMe().then((me) => {
    console.log(`✅ Bot ready: @${me.username}`);

    if (!ytDlpReady) {
        console.warn('[Bot] ⚠️ Bot will start but video downloads will FAIL without yt-dlp!');
    }

    bot.launch()
        .then(() => {
            console.log('✅ Polling started!');
        })
        .catch((error) => {
            console.error('❌ Bot launch failed:', error.message);

            if (error.message.includes('409: Conflict')) {
                console.error('❗ Another bot instance is already running. Please close other windows.');
                console.error('   Solution: Stop other bot processes or restart your computer.');
            } else if (error.message.includes('403: Forbidden')) {
                console.error('❗ Bot token is invalid or bot was deactivated by Telegram.');
                console.error('   Solution: Get a new token from @BotFather on Telegram.');
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                console.error('❗ No internet connection or Telegram API is unreachable.');
                console.error('   Solution: Check your internet connection.');
            }
        });
}).catch((error) => {
    console.error('❌ Invalid token or no internet:', error.message);
    if (error.message.includes('403')) {
        console.error('   Solution: Verify BOT_TOKEN in .env file or get new token from @BotFather');
    }
});

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('[Bot] Shutting down (SIGINT)...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('[Bot] Shutting down (SIGTERM)...');
    bot.stop('SIGTERM');
});

// Unhandled error handler
process.on('uncaughtException', (error) => {
    console.error('[Bot] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Bot] Unhandled Rejection at:', promise, 'reason:', reason);
});
