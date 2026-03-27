/**
 * Website Integration Module
 * Bridges the content from config.ts with the Telegram bot
 * 
 * @author G'ulomov Akmal
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { Markup } = require('telegraf');

const CONFIG_PATH = path.join(__dirname, 'config.ts');

/**
 * Parse config.ts to extract video and music data
 */
const getWebsiteData = () => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            console.error('[WebIntegrate] config.ts topilmadi');
            return { videos: [], music: [] };
        }

        const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
        
        // Extract items using regex
        const extractItems = (str) => {
            const items = [];
            const itemRegex = /\{([\s\S]*?)\}/g;
            let match;
            while ((match = itemRegex.exec(str)) !== null) {
                const itemStr = match[1];
                const id = (itemStr.match(/id:\s*(\d+)/) || [])[1];
                const title = (itemStr.match(/title:\s*["'](.*?)["']/) || [])[1];
                const videoUrl = (itemStr.match(/videoUrl:\s*["'](.*?)["']/) || [])[1];
                const musicUrl = (itemStr.match(/url:\s*["'](.*?)["']/) || [])[1];
                const image = (itemStr.match(/image:\s*["'](.*?)["']/) || [])[1];
                
                if (id && title && (videoUrl || musicUrl)) {
                    items.push({ 
                        id, 
                        title, 
                        url: videoUrl || musicUrl, 
                        image: image || null 
                    });
                }
            }
            return items;
        };

        // Get videos section
        const videosSection = (content.match(/videos:\s*\[([\s\S]*?)\]\s*,/) || [])[1] || '';
        const musicSection = (content.match(/music:\s*\[([\s\S]*?)\]\s*,?/) || [])[1] || '';

        return {
            videos: extractItems(videosSection),
            music: extractItems(musicSection)
        };
    } catch (e) {
        console.error('[WebIntegrate] Parse error:', e.message);
        return { videos: [], music: [] };
    }
};

/**
 * Show templates (designs) list
 * @param {Object} ctx - Telegraf context
 */
const showTemplatesList = async (ctx, page = 0) => {
    const { videos } = getWebsiteData();
    if (videos.length === 0) {
        return ctx.reply('⚠️ Hozircha dizaynlar topilmadi.');
    }

    const pageSize = 8;
    const totalPages = Math.ceil(videos.length / pageSize);
    const start = page * pageSize;
    const end = start + pageSize;
    const currentVideos = videos.slice(start, end);

    let message = `🎨 **Mavjud Dizaynlar (Siz uchun maxsus)**\n\n`;
    message += `Sahifa: ${page + 1}/${totalPages}\n`;
    message += `Jami: ${videos.length} ta dizayn\n\n`;
    message += `Dizaynni ko'rish/yuklash uchun quyidagi tugmalardan foydalaning:`;

    const buttons = currentVideos.map(v => [
        Markup.button.callback(`🎬 ${v.title}`, `design_view_${v.id}`)
    ]);

    // Add pagination
    const navButtons = [];
    if (page > 0) navButtons.push(Markup.button.callback('⬅️ Oldingi', `designs_page_${page - 1}`));
    if (page < totalPages - 1) navButtons.push(Markup.button.callback('Keyingi ➡️', `designs_page_${page + 1}`));
    
    if (navButtons.length > 0) buttons.push(navButtons);
    buttons.push([Markup.button.callback('🔙 Orqaga', 'start_back')]);

    try {
        const keyboard = Markup.inlineKeyboard(buttons);
        if (ctx.callbackQuery) {
            await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard });
        } else {
            await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
        }
    } catch (e) {
        console.error('[WebIntegrate] UI Error:', e.message);
    }
};

/**
 * Handle individual design view
 */
const handleDesignView = async (ctx, id) => {
    const { videos } = getWebsiteData();
    const design = videos.find(v => v.id == id);
    
    if (!design) {
        return ctx.answerCbQuery('❌ Dizayn topilmadi');
    }

    await ctx.answerCbQuery();
    
    const message = `🎬 **Dizayn: ${design.title}**\n\nBu dizaynni yuklab olishingiz yoki ko'rmashingiz mumkin.`;
    
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📥 Yuklab olish', `download_design_${design.id}`)],
        [Markup.button.callback('⬅️ Ro\'yxatga qaytish', 'designs_page_0')]
    ]);

    await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
};

/**
 * Show music list from config.ts
 */
const showMusicList = async (ctx, page = 0) => {
    const { music } = getWebsiteData();
    if (music.length === 0) {
        return ctx.reply('⚠️ Hozircha musiqalar topilmadi.');
    }

    const pageSize = 8;
    const totalPages = Math.ceil(music.length / pageSize);
    const start = page * pageSize;
    const end = start + pageSize;
    const currentMusic = music.slice(start, end);

    let message = `🎵 **Tavsiya etilgan Musiqalar**\n\n`;
    message += `Sahifa: ${page + 1}/${totalPages}\n\n`;
    message += `Musiqani eshitish uchun quyidagilardan birini tanlang:`;

    const buttons = currentMusic.map(m => [
        Markup.button.callback(`🎶 ${m.title}`, `music_view_${m.id}`)
    ]);

    const navButtons = [];
    if (page > 0) navButtons.push(Markup.button.callback('⬅️ Oldingi', `music_list_page_${page - 1}`));
    if (page < totalPages - 1) navButtons.push(Markup.button.callback('Keyingi ➡️', `music_list_page_${page + 1}`));
    
    if (navButtons.length > 0) buttons.push(navButtons);
    buttons.push([Markup.button.callback('🔙 Orqaga', 'start_back')]);

    const keyboard = Markup.inlineKeyboard(buttons);
    if (ctx.callbackQuery) {
        await ctx.editMessageText(message, { parse_mode: 'Markdown', ...keyboard });
    } else {
        await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
    }
};

/**
 * Handle individual music view and download
 */
const handleMusicView = async (ctx, id) => {
    const { music } = getWebsiteData();
    const track = music.find(m => m.id == id);
    
    if (!track) return ctx.answerCbQuery('❌ Musiqa topilmadi');
    
    await ctx.answerCbQuery('🎵 Musiqa yuborilmoqda...');
    
    const localPath = path.join(__dirname, 'public', track.url);
    if (fs.existsSync(localPath)) {
        await ctx.replyWithAudio({ source: localPath }, { 
            title: track.title, 
            caption: `🎵 ${track.title}\n\n🤖 @${ctx.botInfo.username}` 
        });
    } else {
        await ctx.reply(`❌ Fayl topilmadi: ${track.url}`);
    }
};

/**
 * Initialize website integration
 * @param {Object} bot - Telegraf bot instance
 */
const initWebsiteIntegration = (bot) => {
    // Commands
    bot.command('designs', (ctx) => showTemplatesList(ctx));
    bot.command('templates', (ctx) => showTemplatesList(ctx));
    bot.command('music_list', (ctx) => showMusicList(ctx));

    // Callback handlers
    bot.action(/designs_page_(\d+)/, (ctx) => {
        const page = parseInt(ctx.match[1]);
        showTemplatesList(ctx, page);
    });

    bot.action(/music_list_page_(\d+)/, (ctx) => {
        const page = parseInt(ctx.match[1]);
        showMusicList(ctx, page);
    });

    bot.action(/design_view_(\d+)/, (ctx) => {
        const id = ctx.match[1];
        handleDesignView(ctx, id);
    });

    bot.action(/music_view_(\d+)/, (ctx) => {
        const id = ctx.match[1];
        handleMusicView(ctx, id);
    });

    bot.action('start_designs', (ctx) => showTemplatesList(ctx));
    bot.action('start_music', (ctx) => showMusicList(ctx));

    bot.action(/download_design_(\d+)/, async (ctx) => {
        const id = ctx.match[1];
        const { videos } = getWebsiteData();
        const design = videos.find(v => v.id == id);
        
        if (!design) return ctx.reply('❌ Xatolik yuz berdi.');
        
        ctx.answerCbQuery('🚀 Yuklash boshlandi...');
        
        // Since it's a local file URL in config.ts like /videos/v1.mp4,
        // we map it to the actual file path on disk
        const localPath = path.join(__dirname, 'public', design.url);
        
        if (fs.existsSync(localPath)) {
            await ctx.replyWithVideo({ source: localPath }, { caption: `🎨 ${design.title}\n\n🤖 @${ctx.botInfo.username}` });
        } else {
            // Fallback for relative paths or different structure
            const altPath = path.join(__dirname, design.url.startsWith('/') ? design.url.substring(1) : design.url);
            if (fs.existsSync(altPath)) {
                await ctx.replyWithVideo({ source: altPath }, { caption: `🎨 ${design.title}` });
            } else {
                await ctx.reply(`❌ Fayl topilmadi: ${design.url}\nIltimos, adminga xabar bering.`);
            }
        }
    });

    console.log('[WebIntegrate] ✅ Website integration initialized');
};

module.exports = {
    initWebsiteIntegration,
    showTemplatesList,
};
