/**
 * Telegram Video Downloader Bot - Senior-level Refactored Version
 * Improved error handling, code organization, and maintainability
 * 
 * @author G'ulomov Akmal
 * @version 2.0.0
 */

const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import from refactored server
const {
    downloadWithYtDlp,
    sniffWithPlaywright,
    isM3U8,
    isDirectVideo,
    getYtDlpPath,
    getRotatedUserAgent,
    AUTHOR,
} = require('./local-video-api/server');

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

bot.start((ctx) => {
    saveUser(ctx.from.id);
    ctx.reply(
        `Assalomu alaykum! Men Video Downloader va AI botman.\n\n` +
        `Sizga video yuklab berishim yoki Gemini AI yordamida savollaringizga javob berishim mumkin.\n\n` +
        `🤖 Shunchaki savol yozing yoki video havolasini yuboring.`
    );
});

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
// VIDEO DOWNLOAD HANDLER
// ============================================================================

bot.on('text', async (ctx, next) => {
    saveUser(ctx.from.id);
    const url = ctx.message.text.trim();
    
    // Skip if not a URL
    if (!url.startsWith('http')) {
        return next();
    }
    
    const waitMsg = await ctx.reply('🔍 Video ma\'lumotlari olinmoqda, iltimos kuting...');
    let outputPath = null;
    let childProcess = null;
    
    try {
        let videoData;
        let downloadUrl = url;
        
        // Get video info
        if (isDirectVideo(url) || isM3U8(url)) {
            videoData = { url, title: 'Video' };
        } else {
            try {
                videoData = await downloadWithYtDlp(url);
            } catch (ytdlpError) {
                console.log('[Bot] yt-dlp failed, trying Playwright...');
                videoData = await sniffWithPlaywright(url);
                downloadUrl = videoData.url;
            }
        }
        
        if (!videoData || !videoData.url) {
            throw new Error('Video topilmadi');
        }
        
        await bot.telegram.editMessageText(
            ctx.chat.id,
            waitMsg.message_id,
            null,
            '📥 Video yuklanmoqda...'
        );
        
        // Prepare download
        const ytcmd = getYtDlpPath();
        const userAgent = getRotatedUserAgent();
        const safeTitle = sanitizeFilename(videoData.title || 'video');
        const fileName = `bot_download_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.mp4`;
        outputPath = path.join(CONFIG.TEMP_DIR, fileName);
        
        const args = [
            '--no-check-certificates',
            '--user-agent', userAgent,
            '--no-playlist',
            '--geo-bypass',
            '-f', 'best[ext=mp4]/best',
            '-o', outputPath,
        ];

        // Add referer
        try {
            const domain = new URL(downloadUrl).hostname;
            args.push('--referer', `https://${domain}/`);
        } catch {
            args.push('--referer', downloadUrl);
        }

        // Cookie support
        const cookiesPath = path.join(__dirname, 'cookies.txt');
        const apiCookiesPath = path.join(__dirname, 'local-video-api', 'cookies.txt');
        
        if (fs.existsSync(cookiesPath)) {
            args.push('--cookies', cookiesPath);
        } else if (fs.existsSync(apiCookiesPath)) {
            args.push('--cookies', apiCookiesPath);
        }

        args.push(downloadUrl);
        
        console.log(`[Bot] Downloading: ${downloadUrl}`);
        childProcess = spawn(ytcmd, args);
        
        // Timeout handler
        const timeout = setTimeout(() => {
            childProcess.kill('SIGKILL');
            console.log('[Bot] Download timeout');
        }, CONFIG.DOWNLOAD_TIMEOUT);
        
        childProcess.on('close', async (code) => {
            clearTimeout(timeout);
            
            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    const stats = fs.statSync(outputPath);
                    const fileSize = formatFileSize(stats.size);
                    console.log(`[Bot] Downloaded: ${fileSize}`);
                    
                    // Check file size limit
                    if (stats.size > CONFIG.MAX_FILE_SIZE) {
                        await ctx.reply(
                            `⚠️ Video hajmi ${fileSize}. Telegram cheklovi sababli yuborib bo'lmasligi mumkin, lekin urinib ko'raman...`
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
                            caption: `🎬 ${videoData.title || 'Video'}\n📦 Hajmi: ${fileSize}\n\n🤖 @${ctx.botInfo.username} orqali yuklab olindi`,
                        }
                    );
                } catch (sendError) {
                    console.error('[Bot] Send failed:', sendError.message);
                    
                    let errorMessage = '❌ Xatolik: Videoni yuborib bo\'lmadi.';
                    if (sendError.message.includes('Request Entity Too Large')) {
                        errorMessage += ' Video hajmi juda katta.';
                    } else if (sendError.message) {
                        errorMessage += ' ' + sendError.message;
                    }
                    
                    ctx.reply(errorMessage);
                } finally {
                    cleanupDownloadArtifacts(outputPath);
                }
            } else {
                cleanupDownloadArtifacts(outputPath);
                
                if (code !== null) {
                    let failMsg = '❌ Videoni yuklab bo\'lmadi yoki havola yaroqsiz.';
                    if (url.includes('instagram.com') || url.includes('tiktok.com')) {
                        failMsg += '\n\n💡 Maslahat: Instagram va TikTok ba\'zan ruxsat (cookies) talab qiladi. /cookies buyrug\'ini ko\'ring.';
                    }
                    ctx.reply(failMsg);
                } else {
                    ctx.reply('⚠️ Yuklash vaqti tugadi (Timeout).');
                }
            }
        });
        
    } catch (error) {
        console.error('[Bot] Download error:', error.message);
        
        if (outputPath) {
            cleanupDownloadArtifacts(outputPath);
        }
        
        ctx.reply(`❌ Xatolik: ${error.message}`);
    }
});

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
