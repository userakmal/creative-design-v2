const express = require("express");
const cors = require('cors');
const localtunnel = require('localtunnel');
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
let chromium;
try {
    chromium = require("playwright").chromium;
} catch(e) {
    console.log("[Diqqat] Playwright topilmadi. Zaxira skanerlash tizimi ishlata olinmaydi.");
}

const util = require("util");
const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());
app.use(cors());

// Yt-dlp yo'li
const getYtDlp = async () => {
    return ".\\yt-dlp.exe";
};

const AUTHOR = "G'ulomov Akmal";

// Ko'proq User-Agent'lar — cheklovlardan o'tish uchun
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
];

const getRotatedUserAgent = () => {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// ========== URL TURI ANIQLASH ==========
const isM3U8 = (url) => {
    return /\.m3u8(\?|$)/i.test(url) || url.includes('m3u8');
};

const isDirectVideo = (url) => {
    return /\.(mp4|webm|mkv|avi|mov|flv)(\?|$)/i.test(url);
};

// ========== M3U8 YUKLASH (yt-dlp orqali) ==========
const downloadM3U8WithYtDlp = async (url) => {
    const ytcmd = await getYtDlp();
    const userAgent = getRotatedUserAgent();
    
    // yt-dlp m3u8 ni to'g'ridan-to'g'ri qo'llab-quvvatlaydi
    const command = `${ytcmd} --no-check-certificates --user-agent "${userAgent}" -f "best" --dump-json "${url}"`;
    console.log(`[M3U8-YtDlp] Ishga tushyapti...`);
    
    try {
        const { stdout, stderr } = await execPromise(command, { maxBuffer: 1024 * 1024 * 50, timeout: 90000 });
        if (stderr) console.log("[M3U8-YtDlp STDERR]:", stderr.substring(0, 300));
        const videoData = JSON.parse(stdout);
        
        return {
            title: videoData.title || "M3U8 Video",
            url: videoData.url || (videoData.requested_downloads ? videoData.requested_downloads[0].url : ""),
            thumbnail: videoData.thumbnail || null,
            type: "m3u8_ytdlp"
        };
    } catch (err) {
        console.log("[M3U8-YtDlp] Xatolik:", err.message?.substring(0, 200));
        throw err;
    }
};

// ========== ASOSIY YT-DLP YUKLASH (cheklovlardan o'tish) ==========
const downloadWithYtDlp = async (url) => {
    const ytcmd = await getYtDlp();
    const userAgent = getRotatedUserAgent();
    
    // Barcha cheklovlardan o'tish uchun bayroqlar
    const flags = [
        `-f "best"`,
        `--dump-json`,
        `--no-check-certificates`,             // SSL sertifikat tekshirmaslik
        `--user-agent "${userAgent}"`,          // Brauzer ko'rinishida
        `--geo-bypass`,                         // Geo cheklovlardan o'tish
        `--extractor-retries 5`,                // 5 marta qayta urinish
        `--socket-timeout 30`,                  // Socket timeout
        `--no-warnings`,                        // Ogohlantirishlarni yashirish
        `--prefer-insecure`,                    // HTTP ham ruxsat
        `--legacy-server-connect`,              // Eski serverlar bilan moslik
    ].join(" ");
    
    const command = `${ytcmd} ${flags} "${url}"`;
    console.log(`[Yt-Dlp] Ishga tushyapti: URL = ${url.substring(0, 80)}...`);
    
    const { stdout, stderr } = await execPromise(command, { maxBuffer: 1024 * 1024 * 50, timeout: 90000 });
    if (stderr) console.log("[Yt-Dlp STDERR]:", stderr.substring(0, 300));
    console.log("[Yt-Dlp] Tugallandi, JSON parse qilinmoqda...");
    const videoData = JSON.parse(stdout);
    
    return {
        title: videoData.title || "Video",
        url: videoData.url || (videoData.requested_downloads ? videoData.requested_downloads[0].url : ""),
        thumbnail: videoData.thumbnail || null,
        type: "yt-dlp"
    };
};

// ========== PLAYWRIGHT SKANERLASH (CHUQUR — iframe, play tugma, m3u8, mp4) ==========
const sniffWithPlaywright = async (url) => {
    if (!chromium) {
        throw new Error("Zaxira tizimi o'chirilgan (playwright yo'q)");
    }
    const userAgent = getRotatedUserAgent();
    
    console.log("[Playwright] Chuqur skanerlash boshlandi: " + url);
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--allow-running-insecure-content',
        ]
    });
    
    const context = await browser.newContext({ 
        userAgent,
        ignoreHTTPSErrors: true,
        bypassCSP: true,
        javaScriptEnabled: true,
        extraHTTPHeaders: {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url,
        },
        permissions: ['clipboard-read'],
        viewport: { width: 1280, height: 720 },
    });
    
    // Barcha topilgan video URLlarni saqlash
    const foundVideos = [];
    
    // Videoni aniqlash funksiyasi
    const checkVideoUrl = (reqUrl, contentType = '') => {
        if (!reqUrl || reqUrl.startsWith('data:') || reqUrl.includes('advertisement') || reqUrl.includes('/ads/')) return;
        
        // M3U8
        if (reqUrl.includes(".m3u8") || contentType.includes('mpegurl')) {
            // master.m3u8 ni yuqori prioritetda qo'shish
            const isMaster = reqUrl.includes('master') || reqUrl.includes('index');
            foundVideos.push({ url: reqUrl, type: "m3u8", priority: isMaster ? 25 : 10 });
            console.log("[Playwright] M3U8 topildi:", reqUrl.substring(0, 120));
        }
        // MP4
        else if (/\.mp4(\?|$|#)/i.test(reqUrl) || contentType.includes('video/mp4')) {
            foundVideos.push({ url: reqUrl, type: "mp4", priority: 20 });
            console.log("[Playwright] MP4 topildi:", reqUrl.substring(0, 120));
        }
        // WebM / FLV / TS / boshqa video
        else if (/\.(webm|flv|ts|mkv|avi|mov)(\?|$|#)/i.test(reqUrl) || (contentType.includes('video/') && !contentType.includes('javascript'))) {
            foundVideos.push({ url: reqUrl, type: "video", priority: 5 });
            console.log("[Playwright] Video stream topildi:", reqUrl.substring(0, 120));
        }
    };

    // BARCHA FRAME-LARDAN TARMOQ so'rovlarini kuzatish
    const monitorPage = (targetPage) => {
        targetPage.on("response", async (response) => {
            try {
                const reqUrl = response.url();
                const contentType = response.headers()['content-type'] || '';
                checkVideoUrl(reqUrl, contentType);
            } catch(e) {}
        });
    };
    
    const page = await context.newPage();
    monitorPage(page);
    
    // Yangi ochilgan sahifalarni ham kuzatish
    context.on('page', (newPage) => {
        monitorPage(newPage);
    });

    try {
        // 1-BOSQICH: Sahifani yuklash
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        console.log("[Playwright] Sahifa yuklandi, DOM tekshirilmoqda...");
        
        // Birozdan so'ng networkidle ni kutish
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
        
        // 2-BOSQICH: Iframe-larni topib, ulardan ham video izlash
        const allFrames = page.frames();
        console.log(`[Playwright] ${allFrames.length} ta frame topildi`);
        
        for (const frame of allFrames) {
            if (frame === page.mainFrame()) continue;
            try {
                const frameUrl = frame.url();
                console.log("[Playwright] Frame URL:", frameUrl?.substring(0, 100));
                
                // Frame ichidagi video elementlarni tekshirish
                const frameSrcs = await frame.evaluate(() => {
                    const srcs = [];
                    // Video tag
                    document.querySelectorAll('video, video source, source').forEach(v => {
                        if (v.src) srcs.push(v.src);
                        if (v.currentSrc) srcs.push(v.currentSrc);
                    });
                    // JW Player, Video.js, Plyr va boshqa player-lardan izlash
                    if (typeof jwplayer !== 'undefined') {
                        try { const src = jwplayer().getPlaylistItem()?.file; if (src) srcs.push(src); } catch(e) {}
                    }
                    // Global o'zgaruvchilardan video URL izlash
                    const bodyText = document.body?.innerHTML || '';
                    const m3u8Match = bodyText.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
                    if (m3u8Match) srcs.push(m3u8Match[1]);
                    const mp4Match = bodyText.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i);
                    if (mp4Match) srcs.push(mp4Match[1]);
                    return [...new Set(srcs)];
                }).catch(() => []);
                
                for (const src of frameSrcs) {
                    if (src && src.startsWith('http')) {
                        checkVideoUrl(src);
                    }
                }
            } catch(e) {}
        }
        
        // 3-BOSQICH: Agar hali video topilmasa — play tugmasini bosish
        if (foundVideos.length === 0) {
            console.log("[Playwright] Video topilmadi, play tugmalarini izlayapti...");
            
            // Reklamalarni yopish — yopish tugmalarini bosish
            const closeSelectors = [
                '.close', '[class*="close"]', '[id*="close"]', 
                '.dismiss', '[aria-label="Close"]', 'button[class*="close"]',
                '.popup-close', '#overlay-close',
            ];
            for (const sel of closeSelectors) {
                try { await page.click(sel, { timeout: 1000 }); } catch(e) {}
            }
            
            // Play tugmasini bosish (asosiy sahifa va iframelarda)
            const playSelectors = [
                'video', '.play-button', '[class*="play"]', '[id*="play"]',
                '.vjs-big-play-button', '.jw-icon-display',
                '.plyr__control--overlaid', '.video-js .vjs-big-play-button',
                '[class*="player"]', '.fp-play', '.mejs__overlay-play',
                'button[aria-label="Play"]', '.ytp-large-play-button',
                '.flowplayer .fp-ui', '.flowplayer',
            ];
            
            for (const sel of playSelectors) {
                try {
                    const el = await page.$(sel);
                    if (el) {
                        await el.click({ timeout: 2000 });
                        console.log(`[Playwright] "${sel}" tugmasi bosildi`);
                        await page.waitForTimeout(2000);
                        if (foundVideos.length > 0) break;
                    }
                } catch(e) {}
            }
            
            // Iframe ichida ham play tugmasi bosish
            for (const frame of page.frames()) {
                if (frame === page.mainFrame()) continue;
                for (const sel of playSelectors) {
                    try {
                        const el = await frame.$(sel);
                        if (el) {
                            await el.click({ timeout: 2000 });
                            console.log(`[Playwright] Frame ichida "${sel}" tugmasi bosildi`);
                            await page.waitForTimeout(2000);
                            if (foundVideos.length > 0) break;
                        }
                    } catch(e) {}
                }
                if (foundVideos.length > 0) break;
            }
        }
        
        // 4-BOSQICH: Agar hali topilmasa — 5 soniya kutish (dinamik yuklash)
        if (foundVideos.length === 0) {
            console.log("[Playwright] 5 soniya kutilmoqda (dinamik yuklash)...");
            await page.waitForTimeout(5000);
        }
        
        // 5-BOSQICH: Asosiy sahifadagi video elementlarni DOM dan tekshirish
        if (foundVideos.length === 0) {
            const videoSrcs = await page.evaluate(() => {
                const srcs = [];
                // Video, source taglar
                document.querySelectorAll('video, video source, source, embed, object').forEach(v => {
                    if (v.src) srcs.push(v.src);
                    if (v.currentSrc) srcs.push(v.currentSrc);
                    if (v.data) srcs.push(v.data);
                });
                // Iframedagi src (video player)
                document.querySelectorAll('iframe').forEach(iframe => {
                    if (iframe.src) srcs.push(iframe.src);
                });
                // Sahifa HTML dan m3u8/mp4 havolalarni izlash
                const bodyText = document.body?.innerHTML || '';
                const m3u8Matches = bodyText.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || [];
                const mp4Matches = bodyText.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || [];
                srcs.push(...m3u8Matches, ...mp4Matches);
                
                // Script taglar ichidan video URL izlash
                document.querySelectorAll('script').forEach(script => {
                    const text = script.textContent || '';
                    const m3u8 = text.match(/["'](https?:\/\/[^\s"']+\.m3u8[^\s"']*)/gi) || [];
                    const mp4 = text.match(/["'](https?:\/\/[^\s"']+\.mp4[^\s"']*)/gi) || [];
                    m3u8.forEach(u => srcs.push(u.replace(/^["']/, '')));
                    mp4.forEach(u => srcs.push(u.replace(/^["']/, '')));
                });
                
                return [...new Set(srcs)];
            }).catch(() => []);
            
            for (const src of videoSrcs) {
                if (src && src.startsWith('http')) {
                    checkVideoUrl(src);
                }
            }
        }
        
        // 6-BOSQICH: Iframe src URL larga alohida Playwright sahifa orqali kirish
        if (foundVideos.length === 0) {
            console.log("[Playwright] Iframe URLlarga alohida kirilmoqda...");
            const iframeSrcs = await page.evaluate(() => {
                return [...document.querySelectorAll('iframe')].map(f => f.src).filter(s => s && s.startsWith('http'));
            }).catch(() => []);
            
            for (const iframeSrc of iframeSrcs.slice(0, 3)) {
                try {
                    console.log("[Playwright] Iframe URL ochilmoqda:", iframeSrc.substring(0, 100));
                    const iframePage = await context.newPage();
                    monitorPage(iframePage);
                    
                    await iframePage.goto(iframeSrc, { waitUntil: "domcontentloaded", timeout: 15000 });
                    await iframePage.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
                    
                    // Iframe sahifasidan DOM scrape
                    const innerSrcs = await iframePage.evaluate(() => {
                        const srcs = [];
                        document.querySelectorAll('video, source').forEach(v => { if (v.src) srcs.push(v.src); });
                        const bodyText = document.body?.innerHTML || '';
                        const m3u8 = bodyText.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || [];
                        const mp4 = bodyText.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || [];
                        srcs.push(...m3u8, ...mp4);
                        // Script taglardan izlash
                        document.querySelectorAll('script').forEach(script => {
                            const text = script.textContent || '';
                            const m = text.match(/["'](https?:\/\/[^\s"']+\.(m3u8|mp4)[^\s"']*)/gi) || [];
                            m.forEach(u => srcs.push(u.replace(/^["']/, '')));
                        });
                        return [...new Set(srcs)];
                    }).catch(() => []);
                    
                    for (const src of innerSrcs) {
                        if (src && src.startsWith('http')) checkVideoUrl(src);
                    }
                    
                    // Play tugmasini bosish
                    if (foundVideos.length === 0) {
                        for (const sel of ['.play-button', '[class*="play"]', 'video', '.vjs-big-play-button', '.jw-icon-display']) {
                            try {
                                const el = await iframePage.$(sel);
                                if (el) { await el.click({ timeout: 2000 }); await iframePage.waitForTimeout(3000); }
                                if (foundVideos.length > 0) break;
                            } catch(e) {}
                        }
                    }
                    
                    await iframePage.close();
                    if (foundVideos.length > 0) break;
                } catch(e) {
                    console.log("[Playwright] Iframe xatolik:", e.message?.substring(0, 80));
                }
            }
        }
        
    } catch(e) {
        console.log("[Playwright] Sahifa yuklash timeout/xatolik:", e.message?.substring(0, 100));
    }
    
    await browser.close();
    
    if (foundVideos.length === 0) {
        throw new Error("Video topilmadi yoki himoyalangan. Sahifada video element yo'q.");
    }
    
    // Dublikatlarni olib tashlash va eng yaxshi natijani tanlash
    const uniqueUrls = new Map();
    for (const v of foundVideos) {
        const cleanUrl = v.url.split('?')[0]; // query-siz URL
        if (!uniqueUrls.has(cleanUrl) || uniqueUrls.get(cleanUrl).priority < v.priority) {
            uniqueUrls.set(cleanUrl, v);
        }
    }
    
    const sorted = [...uniqueUrls.values()].sort((a, b) => b.priority - a.priority);
    const best = sorted[0];
    
    console.log(`[Playwright] ✅ Tanlangan: ${best.type} — ${best.url.substring(0, 120)}`);
    console.log(`[Playwright] Jami topilgan: ${sorted.length} ta unikal video URL`);
    
    return { url: best.url, type: `playwright_${best.type}` };
};

// ========== ASOSIY API ENDPOINT ==========
app.post("/api/download", async (req, res) => {
    try {
        const { url } = req.body;
        console.log("\n==> Yangi so'rov keldi: " + url);
        
        if (!url) {
            return res.status(400).json({
                status: "error",
                message: "URL belgilanmadi"
            });
        }

        // --- 1. DIRECT M3U8 URL ---
        if (isM3U8(url)) {
            console.log("[Tur] M3U8 havola aniqlandi");
            
            try {
                // m3u8 ni yt-dlp orqali yuklash
                const m3u8Data = await downloadM3U8WithYtDlp(url);
                return res.status(200).json({
                    status: "success",
                    author: AUTHOR,
                    type: m3u8Data.type,
                    data: {
                        title: m3u8Data.title,
                        url: m3u8Data.url,
                        thumbnail: m3u8Data.thumbnail
                    }
                });
            } catch (m3u8Err) {
                console.log("[M3U8] yt-dlp ishlamadi, to'g'ridan-to'g'ri URL qaytarilmoqda...");
                // M3U8 URL ni o'zi qaytarish — frontend yoki VLC ochsin
                return res.status(200).json({
                    status: "success",
                    author: AUTHOR,
                    type: "m3u8_direct",
                    data: {
                        title: "M3U8 Video Stream",
                        url: url,
                        thumbnail: null,
                        isM3U8: true
                    }
                });
            }
        }

        // --- 2. DIRECT VIDEO URL (mp4, webm va h.k.) ---
        if (isDirectVideo(url)) {
            console.log("[Tur] To'g'ridan-to'g'ri video havola");
            return res.status(200).json({
                status: "success",
                author: AUTHOR,
                type: "direct",
                data: {
                    title: "Video",
                    url: url,
                    thumbnail: null
                }
            });
        }

        // --- 3. ODDIY URL (YouTube, TikTok, Instagram va h.k.) ---
        try {
            const ytdlpData = await downloadWithYtDlp(url);
            return res.status(200).json({
                status: "success",
                author: AUTHOR,
                type: ytdlpData.type,
                data: {
                    title: ytdlpData.title,
                    url: ytdlpData.url,
                    thumbnail: ytdlpData.thumbnail,
                    isM3U8: ytdlpData.url ? isM3U8(ytdlpData.url) : false
                }
            });
        } catch (ytDlpError) {
            console.log("[Xatolik yt-dlp]", ytDlpError.message?.substring(0, 200));
            console.log("[Fallback] Playwright ga o'tilyabdi...");
            
            try {
                const fallbackData = await sniffWithPlaywright(url);
                return res.status(200).json({
                    status: "success",
                    author: AUTHOR,
                    type: fallbackData.type,
                    data: {
                        title: "Universal Video",
                        url: fallbackData.url,
                        thumbnail: null,
                        isM3U8: fallbackData.url ? isM3U8(fallbackData.url) : false
                    }
                });
            } catch (playwrightErr) {
                throw new Error("Video topilmadi. Havola to'g'riligini tekshiring yoki boshqa havolani sinab ko'ring.");
            }
        }
    } catch (error) {
        console.log("XATO:", error.message);
        return res.status(500).json({
            status: "error",
            text: error.message
        });
    }
});

// ========== HEALTH CHECK ==========
app.get("/", (req, res) => {
    res.json({ status: "ok", author: AUTHOR, features: ["yt-dlp", "m3u8", "playwright", "bypass"] });
});

const PORT = 3000;
const SUBDOMAIN = "creative-video-api";

app.listen(PORT, async () => {
    console.log(`\n================================`);
    console.log(`🚀 Universal Video Server Ishga Tushdi (Port: ${PORT})`);
    console.log(`📥 Qo'llab-quvvatlanadi: YouTube, TikTok, Instagram, M3U8, MP4, va boshqalar`);
    console.log(`🔓 Cheklovlardan o'tish: GEO-bypass, SSL-bypass, UA rotation`);
    console.log(`Muallif: ${AUTHOR}`);
    console.log(`================================`);
    console.log(`🌐 API manzili: http://localhost:${PORT}/api/download`);
    
    // Tunnellni avtomatik yoqish
    const setupTunnel = async () => {
        try {
            console.log(`\n[Tunnel] Internetga ulanishga harakat qilinmoqda (${SUBDOMAIN}.loca.lt)...`);
            const tunnel = await localtunnel({ 
                port: PORT, 
                subdomain: SUBDOMAIN 
            });

            console.log(`\n✅ TUNNEL TAYYOR!`);
            console.log(`🔗 Tashqi havola: ${tunnel.url}`);
            console.log(`--------------------------------`);
            console.log(`(Ushbu oynani yopmang, video yuklash uchun server yoniq turishi kerak)\n`);

            tunnel.on('close', () => {
                console.log("\n[!] Tunnel yopildi. Qayta ulanishga harakat qilinmoqda...");
                setTimeout(setupTunnel, 5000);
            });

            tunnel.on('error', (err) => {
                console.error("\n[Xato] Tunnelda xatolik:", err.message);
                tunnel.close();
            });

        } catch (e) {
            console.error("\n[Xato] Tunnelni yoqishda xatolik:", e.message);
            console.log("5 soniyadan so'ng qayta uriniladi...");
            setTimeout(setupTunnel, 5000);
        }
    };

    setupTunnel();
});
