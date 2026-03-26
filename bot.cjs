const { Telegraf } = require('telegraf');
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
const ADMIN_ID = 0; // ⚠️ O'zingizning Telegram ID'ingizni bu yerga yozing (masalan: 12345678)
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const bot = new Telegraf(BOT_TOKEN);

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

console.log("🚀 Telegram Bot boshlanmoqda...");

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
    ctx.reply(`Assalomu alaykum! Men Video Downloader botman.\n\nSizga YouTube, TikTok, Instagram va boshqa saytlardan video yuklab berishim mumkin.\n\nMenga shunchaki video havolasini yuboring.`);
});

// Havolalarni tutib olish
bot.on('text', async (ctx, next) => {
    saveUser(ctx.from.id);
    const url = ctx.message.text.trim();
    if (!url.startsWith('http')) return next();

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

bot.command('stats', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const users = loadUsers();
    ctx.reply(`📊 Bot statistikasi:\n\n👥 Foydalanuvchilar: ${users.length} ta`);
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
