const express = require("express");
const cors = require('cors');
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
    try {
        await execPromise("yt-dlp --version");
        return "yt-dlp";
    } catch {
        console.log("Diqqat: yt-dlp topilmadi. Tizim npx yt-dlp ni chaqirmoqda...");
        return "npx yt-dlp";
    }
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
            const command = `${ytcmd} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --dump-json "${url}"`;
            console.log("[Yt-Dlp] Ishga tushyapti...");
            
            const { stdout } = await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });
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
app.listen(PORT, () => {
    console.log(`\n================================`);
    console.log(`🚀 Universal Video Server Ishga Tushdi (Port: ${PORT})`);
    console.log(`Muallif: ${AUTHOR}`);
    console.log(`================================`);
    console.log(`🌐 API manzili: http://localhost:${PORT}/api/download`);
    console.log(`(Ushbu oynani yopmang, video yuklash uchun server yoniq turishi kerak)`);
});
