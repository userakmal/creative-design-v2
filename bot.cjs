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
const BOT_TOKEN = '8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso'; // @BotFather orqali olingan token
const bot = new Telegraf(BOT_TOKEN);

console.log("🚀 Telegram Bot boshlanmoqda...");

// Start buyrug'i
bot.start((ctx) => {
    ctx.reply(`Assalomu alaykum! Men Video Downloader botman.\n\nSizga YouTube, TikTok, Instagram va boshqa saytlardan video yuklab berishim mumkin.\n\nMenga shunchaki video havolasini yuboring.`);
});

// Havolalarni tutib olish
bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    
    // URL ekanligini tekshirish
    if (!url.startsWith('http')) {
        return;
    }

    const waitMsg = await ctx.reply("🔍 Video ma'lumotlari olinmoqda, iltimos kuting...");

    try {
        let videoData;
        
        // 1. Direct Video yoki M3U8 tekshirish
        if (isDirectVideo(url) || isM3U8(url)) {
            videoData = { url, title: "Video" };
        } else {
            // 2. Yt-Dlp orqali ma'lumot olish
            try {
                videoData = await downloadWithYtDlp(url);
            } catch (e) {
                // 3. Fallback: Playwright
                videoData = await sniffWithPlaywright(url);
            }
        }

        if (!videoData || !videoData.url) {
            throw new Error("Video topilmadi.");
        }

        await bot.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, "📥 Video yuklanmoqda...");

        // Fayl nomi va yo'li
        const ytcmd = await getYtDlp();
        const userAgent = getRotatedUserAgent();
        const fileName = `bot_download_${Date.now()}.mp4`;
        const outputPath = path.join(__dirname, 'local-video-api', fileName);

        // yt-dlp orqali yuklash
        const args = [
            '--no-check-certificates',
            '--user-agent', userAgent,
            '-f', 'best[ext=mp4]/best',
            '-o', outputPath,
            videoData.url
        ];

        const child = spawn(ytcmd, args);

        child.on('close', async (code) => {
            if (code === 0 && fs.existsSync(outputPath)) {
                try {
                    await bot.telegram.editMessageText(ctx.chat.id, waitMsg.message_id, null, "✅ Yuklandi! Telegramga yuborilmoqda...");
                    
                    // Videoni yuborish
                    await ctx.replyWithVideo({ source: outputPath }, {
                        caption: `🎬 ${videoData.title || 'Video'}\n\n🤖 @${ctx.botInfo.username} orqali yuklab olindi`,
                    });

                    // Tozalash
                    setTimeout(() => {
                        try { fs.unlinkSync(outputPath); } catch(e) {}
                    }, 5000);
                } catch (sendErr) {
                    console.error("Yuborishda xato:", sendErr.message);
                    ctx.reply("❌ Videoni yuborishda xatolik yuz berdi. Fayl hajmi juda katta bo'lishi mumkin.");
                }
            } else {
                ctx.reply("❌ Videoni yuklab bo'lmadi.");
            }
        });

    } catch (err) {
        console.error("Xato:", err.message);
        ctx.reply(`❌ Xatolik: ${err.message}`);
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
