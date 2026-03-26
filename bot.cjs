const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { 
    downloadWithYtDlp, 
    sniffWithPlaywright, 
    isM3U8, 
    isDirectVideo, 
    getYtDlp, 
    getRotatedUserAgent,
    AUTHOR 
} = require('./local-video-api/server');

// --- BOT SOZLAMALARI ---
const BOT_TOKEN = '8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso';
const ADMIN_ID = 853691902;
const GEMINI_API_KEY = 'AIzaSyD3sEfK9mIzWjOEkO5ykxQLr5zTb7R1LUQ';
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const bot = new Telegraf(BOT_TOKEN);

// Gemini Sozlamalari (Senior Architect Level)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Standart model: gemini-1.5-flash (v1 barqaror)
let model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: 'v1' });

// Modellarni tekshirish va terminalda ko'rsatish
async function syncGeminiModels() {
    try {
        console.log("🔍 Gemini diagnostikasi boshlanmoqda...");
        const result = await genAI.listModels();
        console.log("✅ Sizning API kalitingiz uchun mavjud modellardan biri:");
        if (result.models && result.models.length > 0) {
            // Birinchi mos keladigan flash modelni tanlashga urinish
            const flashModel = result.models.find(m => m.name.includes('flash'));
            if (flashModel) {
                const modelName = flashModel.name.split('/').pop();
                console.log(` 🌀 Mos model topildi: ${modelName}`);
                model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
            }
        }
    } catch (e) {
        console.error("⚠️ Gemini diagnostikasida xato (lekin bot ishlashda davom etadi):", e.message);
    }
}
syncGeminiModels();

// --- FOYDALANUVCHILARNI BOSHQARISH ---
const loadUsers = () => {
    try {
        if (!fs.existsSync(USERS_FILE)) return [];
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) { return []; }
};

const saveUser = (id) => {
    let users = loadUsers();
    if (!users.includes(id)) {
        users.push(id);
        if (!fs.existsSync(path.dirname(USERS_FILE))) {
            fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
        }
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
};

// --- YORDAMCHI FUNKSIYALAR (SENIOR LEVEL) ---
const safeUnlink = (p) => {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (e) {}
};

const fullCleanup = (outputPath) => {
    safeUnlink(outputPath);
    safeUnlink(outputPath + '.part');
    safeUnlink(outputPath + '.ytdl');
};

console.log("🚀 Telegram Bot (v2.1 Updated) boshlanmoqda...");

// Startapda eski axlatlarni tozalash
const startupCleanup = () => {
    console.log("[Bot] Avvalgi seanslardan qolgan qoldiqlar tozalanmoqda...");
    const dir = path.join(__dirname, 'local-video-api');
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
            if (file.startsWith('bot_download_')) {
                fullCleanup(path.join(dir, file));
            }
        });
    }
};
startupCleanup();

// Start buyrug'i
bot.start((ctx) => {
    saveUser(ctx.from.id);
    ctx.reply(`Assalomu alaykum! Men Video Downloader va AI botman.\n\nSizga video yuklab berishim yoki Gemini AI yordamida savollaringizga javob berishim mumkin.\n\n🤖 Shunchaki savol yozing yoki video havolasini yuboring.`);
});

// ID ni bilish uchun yordamchi buyruq
bot.command('myid', (ctx) => {
    ctx.reply(`Sizning Telegram ID raqamingiz: <code>${ctx.from.id}</code>`, { parse_mode: 'HTML' });
});

// Havolalarni tutib olish
bot.on('text', async (ctx, next) => {
    saveUser(ctx.from.id);
    const url = ctx.message.text.trim();
    
    // Agar bu havola bo'lsa, yuklashni boshlaymiz
    if (url.startsWith('http')) {

    const waitMsg = await ctx.reply("🔍 Video ma'lumotlari olinmoqda, iltimos kuting...");
    let outputPath = null;

    try {
        let videoData;
        let downloadUrl = url;

        // 1. Meta-ma'lumotlarni olish
        if (isDirectVideo(url) || isM3U8(url)) {
            videoData = { url, title: "Video" };
        } else {
            try {
                videoData = await downloadWithYtDlp(url);
            } catch (e) {
                videoData = await sniffWithPlaywright(url);
                downloadUrl = videoData.url;
            }
        }

        if (!videoData || !videoData.url) throw new Error("Video topilmadi.");

        await bot.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, "📥 Video yuklanmoqda...");

        // 2. Yuklashni tayyorlash
        const ytcmd = await getYtDlp();
        const userAgent = getRotatedUserAgent();
        const fileName = `bot_download_${Date.now()}.mp4`;
        outputPath = path.join(__dirname, 'local-video-api', fileName);

        const args = [
            '--no-check-certificates',
            '--user-agent', userAgent,
            '--no-playlist',
            '--geo-bypass',
            '-f', 'best[ext=mp4]/best',
            '-o', outputPath,
            downloadUrl
        ];

        console.log(`[Bot] Download start: ${downloadUrl}`);
        const child = spawn(ytcmd, args);

        // 3. Timeout boshqaruvi
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            console.log(`[Bot] Download timeout: ${downloadUrl}`);
        }, 180000); // 3 daqiqa limit

        child.on('close', async (code) => {
            clearTimeout(timeout);
            
            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    const stats = fs.statSync(outputPath);
                    const mb = (stats.size / (1024 * 1024)).toFixed(1);
                    console.log(`[Bot] Yuklandi: ${mb} MB`);

                    if (stats.size > 50 * 1024 * 1024) {
                        await ctx.reply(`⚠️ Video hajmi ${mb} MB. Telegram cheklovi sababli yuborib bo'lmasligi mumkin, lekin urinib ko'raman...`);
                    }

                    await bot.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, "✅ Yuklandi! Telegramga yuborilmoqda...");
                    
                    await ctx.replyWithVideo({ source: outputPath }, {
                        caption: `🎬 ${videoData.title || 'Video'}\n📦 Hajmi: ${mb} MB\n\n🤖 @${ctx.botInfo.username} orqali yuklab olindi`,
                    });
                } catch (sendErr) {
                    console.error("[Bot] Yuborishda xato:", sendErr.message);
                    ctx.reply(`❌ Xatolik: Videoni yuborib bo'lmadi. ${sendErr.message.includes('Request Entity Too Large') ? 'Video hajmi juda katta.' : sendErr.message}`);
                } finally {
                    fullCleanup(outputPath);
                }
            } else {
                fullCleanup(outputPath);
                if (code !== null) { // Agar timeout bo'lmasa
                    ctx.reply("❌ Videoni yuklab bo'lmadi yoki havola yaroqsiz.");
                } else {
                    ctx.reply("⚠️ Yuklash vaqti tugadi (Timeout).");
                }
            }
        });

    } catch (err) {
        console.error("[Bot] Global Error:", err.message);
        ctx.reply(`❌ Xatolik: ${err.message}`);
        if (outputPath) fullCleanup(outputPath);
    }
    } else {
        return next();
    }
});

// Reklama yuborish (Admin buyrug'i)
bot.command('send', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;

    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) return ctx.reply("Iltimos, reklama matnini yozing. Masalan: /send Salom barchaga");

    const users = loadUsers();
    let count = 0;
    let blocked = 0;

    const waitMsg = await ctx.reply(`📣 Reklama ${users.length} ta foydalanuvchiga yuborilmoqda...`);

    for (const userId of users) {
        try {
            await bot.telegram.sendMessage(userId, message);
            count++;
        } catch (err) {
            if (err.description && err.description.includes('bot was blocked')) {
                blocked++;
            }
        }
    }

    await bot.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, `✅ Reklama yakunlandi!\n\n👤 Qabul qildi: ${count}\n🚫 Bloklagan: ${blocked}`);
});

bot.command(['stats', 'stars'], (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const users = loadUsers();
    ctx.reply(`📊 Bot statistikasi:\n\n👥 Foydalanuvchilar: ${users.length} ta`);
});

// Gemini AI handler (Senior Approach with fallback & detailed logging)
bot.on('text', async (ctx, next) => {
    const text = ctx.message.text;
    if (text.startsWith('/')) return next(); 

    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
            return ctx.reply("⚠️ Gemini AI kaliti o'rnatilmagan. Iltimos, admin bilan bog'laning.");
        }

        await ctx.sendChatAction('typing');
        
        // 1-urinish
        try {
            const result = await model.generateContent(text);
            const response = await result.response;
            const aiText = response.text();
            return await ctx.reply(aiText, { parse_mode: 'Markdown' });
        } catch (geminiErr) {
            console.error(`[Gemini Error - 1st Try]: ${geminiErr.message}`);
            
            // Fallback Urinish (Agar birinchi model 404 bo'lsa)
            if (geminiErr.message.includes('404')) {
                console.log("🔄 Zaxira modelga (gemini-1.5-pro) o'tilmoqda...");
                const backupModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }, { apiVersion: 'v1' });
                const result = await backupModel.generateContent(text);
                const response = await result.response;
                return await ctx.reply(response.text(), { parse_mode: 'Markdown' });
            }
            throw geminiErr; // Agar 404 bo'lmasa, yuqoriga uzatamiz
        }
    } catch (err) {
        console.error("[Gemini Global Error]:", err.message);
        let errorMsg = `❌ AI xatosi: ${err.message}`;
        if (err.message.includes('404')) {
            errorMsg += "\n\n💡 Maslahat: API kalitining modellarga ruxsati yo'q yoki model nomi xato. Terminaldagi model ro'yxatini tekshiring.";
        }
        ctx.reply(errorMsg);
    }
});

// Botni ishga tushirish
console.log("... Bot ma'lumotlari tekshirilmoqda");
bot.telegram.getMe().then((me) => {
    console.log(`✅ Bot topildi: @${me.username}`);
    bot.launch().then(() => {
        console.log("✅ Polling boshlandi!");
    }).catch((err) => {
        console.error("❌ Botni ishga tushirishda xato:", err.message);
        if (err.message.includes('409: Conflict')) {
            console.error("❗️ Boshqa bot nusxasi allaqachon ishlamoqda. Iltimos, boshqa oynalarni yoping.");
        }
    });
}).catch((err) => {
    console.error("❌ Token hato yoki internet yo'q:", err.message);
});

// To'xtatish
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
