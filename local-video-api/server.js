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

// ========== PLAYWRIGHT SKANERLASH (m3u8 + mp4 ushlash) ==========
const sniffWithPlaywright = async (url) => {
    if (!chromium) {
        throw new Error("Zaxira tizimi o'chirilgan (playwright yo'q)");
    }
    const userAgent = getRotatedUserAgent();
    
    console.log("[PlaywrightFallback] Skanerlash boshlandi: " + url);
    const browser = await chromium.launch({
        headless: true
    });
    
    const context = await browser.newContext({ 
        userAgent,
        ignoreHTTPSErrors: true,           // SSL xatolarni o'tkazib yuborish
        bypassCSP: true,                   // Content Security Policy bypass
        extraHTTPHeaders: {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': url,
        }
    });
    const page = await context.newPage();
    
    // Barcha topilgan video URLlarni saqlash
    const foundVideos = [];
    
    page.on("response", async (response) => {
        const reqUrl = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        // M3U8 playlist topildi
        if (reqUrl.includes(".m3u8") || contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegURL')) {
            foundVideos.push({ url: reqUrl, type: "m3u8", priority: 10 });
            console.log("[Playwright] M3U8 topildi:", reqUrl.substring(0, 100));
        }
        // MP4 video topildi
        else if (reqUrl.includes(".mp4") || contentType.includes('video/mp4')) {
            foundVideos.push({ url: reqUrl, type: "mp4", priority: 20 });
            console.log("[Playwright] MP4 topildi:", reqUrl.substring(0, 100));
        }
        // Boshqa video formatlar
        else if (reqUrl.includes(".webm") || reqUrl.includes(".ts") || contentType.includes('video/')) {
            foundVideos.push({ url: reqUrl, type: "video", priority: 5 });
            console.log("[Playwright] Video stream topildi:", reqUrl.substring(0, 100));
        }
    });

    try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
        
        // Agar hech narsa topilmasa — sahifadagi video elementlarni tekshirish
        if (foundVideos.length === 0) {
            const videoSrcs = await page.evaluate(() => {
                const videos = document.querySelectorAll('video, video source');
                const srcs = [];
                videos.forEach(v => {
                    if (v.src) srcs.push(v.src);
                    if (v.currentSrc) srcs.push(v.currentSrc);
                    const source = v.querySelector && v.querySelector('source');
                    if (source && source.src) srcs.push(source.src);
                });
                return [...new Set(srcs)];
            });
            
            for (const src of videoSrcs) {
                if (src && src.startsWith('http')) {
                    foundVideos.push({ 
                        url: src, 
                        type: src.includes('.m3u8') ? 'm3u8' : 'mp4', 
                        priority: 15 
                    });
                }
            }
        }
    } catch(e) {
        console.log("[Playwright] Sahifa yuklash timeout/xatolik:", e.message?.substring(0, 100));
    }
    
    await browser.close();
    
    if (foundVideos.length === 0) {
        throw new Error("Video topilmadi yoki himoyalangan");
    }
    
    // Eng yaxshi natijani tanlash (mp4 > m3u8 > boshqa)
    foundVideos.sort((a, b) => b.priority - a.priority);
    const best = foundVideos[0];
    
    console.log(`[Playwright] Tanlangan: ${best.type} — ${best.url.substring(0, 100)}`);
    
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
