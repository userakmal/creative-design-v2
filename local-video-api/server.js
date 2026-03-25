const express = require("express");
const cors = require('cors');
const localtunnel = require('localtunnel');
const { exec } = require("child_process");
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

// Yt-dlp yuklash (avtomatik ravishda ddl)
const getYtDlp = async () => {
    return ".\\yt-dlp.exe";

};

const AUTHOR = "G'ulomov Akmal";

const getRotatedUserAgent = () => {
    const agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
    ];
    return agents[Math.floor(Math.random() * agents.length)];
};

const sniffWithPlaywright = async (url) => {
    if (!chromium) {
        throw new Error("Zaxira tizimi o'chirilgan (playwright yo'q)");
    }
    const userAgent = getRotatedUserAgent();
    
    console.log("[PlaywrightFallback] Skanerlash boshlandi: " + url);
    const browser = await chromium.launch({
        headless: true
    });
    
    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();
    
    let videoUrl = null;
    
    page.on("response", async (response) => {
        const reqUrl = response.url();
        if (reqUrl.includes(".m3u8") || reqUrl.includes(".mp4")) {
            videoUrl = reqUrl;
            console.log("[Muvaffaqiyat] Uslandi:", videoUrl);
        }
    });

    try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    } catch(e) {
        // timeout
    }
    
    await browser.close();
    
    if (!videoUrl) {
        throw new Error("Video topilmadi yoki himoyalangan");
    }
    
    return { url: videoUrl, type: "playwright_sniffed" };
};

app.post("/api/download", async (req, res) => {
    try {
        const { url } = req.body;
        console.log("==> Yangi so'rov keldi: " + url);
        
        if (!url) {
            return res.status(400).json({
                status: "error",
                message: "URL belgilanmadi"
            });
        }

        try {
            const ytcmd = await getYtDlp();
            const command = `${ytcmd} -f "best" --dump-json "${url}"`;
            console.log(`[Yt-Dlp] Ishga tushyapti: ${command}`);
            
            const { stdout, stderr } = await execPromise(command, { maxBuffer: 1024 * 1024 * 50, timeout: 60000 });
            if (stderr) console.log("[Yt-Dlp STDERR]:", stderr);
            console.log("[Yt-Dlp] Tugallandi, JSON parse qilinmoqda...");
            const videoData = JSON.parse(stdout);
            
            return res.status(200).json({
                status: "success",
                author: AUTHOR,
                type: "yt-dlp",
                data: {
                    title: videoData.title || "Video",
                    url: videoData.url || (videoData.requested_downloads ? videoData.requested_downloads[0].url : ""),
                    thumbnail: videoData.thumbnail
                }
            });
        } catch (ytDlpError) {
            console.log("[Xatolik yt-dlp] Fallback ga o'tilyabdi (Playwright)...");
            const fallbackData = await sniffWithPlaywright(url);
            return res.status(200).json({
                status: "success",
                author: AUTHOR,
                type: "playwright",
                data: {
                    title: "Universal Video",
                    url: fallbackData.url,
                    thumbnail: null
                }
            });
        }
    } catch (error) {
        console.log("XATO:", error.message);
        return res.status(500).json({
            status: "error",
            text: error.message
        });
    }
});

const PORT = 3000;
const SUBDOMAIN = "creative-video-api";

app.listen(PORT, async () => {
    console.log(`\n================================`);
    console.log(`🚀 Universal Video Server Ishga Tushdi (Port: ${PORT})`);
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
