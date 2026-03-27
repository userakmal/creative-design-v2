/**
 * Universal Video Downloader API Server
 * Senior-level refactored version with proper error handling,
 * security hardening, and maintainable architecture
 * 
 * @author G'ulomov Akmal
 * @version 2.0.0
 */

const express = require('express');
const cors = require('cors');
const localtunnel = require('localtunnel');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { chromium } = require('playwright');

const execPromise = util.promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    SUBDOMAIN: process.env.TUNNEL_SUBDOMAIN || 'creative-video-api',
    DOWNLOAD_TIMEOUT: parseInt(process.env.DOWNLOAD_TIMEOUT || '300000', 10), // 5 minutes
    CLEANUP_INTERVAL: parseInt(process.env.CLEANUP_INTERVAL || '300000', 10),
    MAX_CONCURRENT_DOWNLOADS: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '10', 10),
};

const AUTHOR = 'G\'ulomov Akmal';

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getRotatedUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const isM3U8 = (url) => /\.m3u8(\?|$)/i.test(url) || url.includes('m3u8');

const isDirectVideo = (url) => /\.(mp4|webm|mkv|avi|mov|flv)(\?|$|#)/i.test(url);

const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const sanitizeFilename = (filename, maxLength = 50) => {
    return filename
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\.\./g, '')
        .substring(0, maxLength) || 'video';
};

const generateJobId = (prefix = 'job') => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const safeUnlink = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
};

const cleanupDownloadArtifacts = (basePath) => {
    const extensions = ['.part', '.ytdl', '.tmp', '.download'];
    safeUnlink(basePath);
    extensions.forEach(ext => safeUnlink(basePath + ext));
};

const cleanupOldFiles = (directory, maxAgeHours = 24) => {
    console.log('[Cleanup] Removing old temporary files...');
    let count = 0;
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    
    try {
        const files = fs.readdirSync(directory);
        files.forEach(file => {
            if (file.endsWith('.mp4') || file.endsWith('.part') || file.endsWith('.ytdl')) {
                const filePath = path.join(directory, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtimeMs > maxAge) {
                        safeUnlink(filePath);
                        count++;
                    }
                } catch {}
            }
        });
        if (count > 0) console.log(`[Cleanup] Removed ${count} old file(s)`);
    } catch (e) {
        console.error('[Cleanup] Error:', e.message);
    }
    return count;
};

const getYtDlpPath = () => {
    const possiblePaths = [
        path.join(__dirname, 'yt-dlp.exe'),
        path.join(process.cwd(), 'yt-dlp.exe'),
        'yt-dlp',
    ];
    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) return p;
        } catch {}
    }
    return 'yt-dlp';
};

const buildYtDlpArgs = (url, outputPath, format = 'best', userAgent) => {
    const ua = userAgent || getRotatedUserAgent();
    const args = [
        '--no-check-certificates',
        '--user-agent', ua,
        '--geo-bypass',
        '--prefer-insecure',
        '--legacy-server-connect',
        '--extractor-retries', '5',
        '--socket-timeout', '30',
        '--no-warnings',
        '-f', format,
        '--newline',
        '-o', outputPath,
    ];

    // Add referer based on domain
    try {
        const domain = new URL(url).hostname;
        args.push('--referer', `https://${domain}/`);
    } catch {
        args.push('--referer', url);
    }

    // Support cookies
    const cookiesPath = path.join(__dirname, 'cookies.txt');
    const rootCookiesPath = path.join(process.cwd(), 'cookies.txt');
    
    if (fs.existsSync(cookiesPath)) {
        args.push('--cookies', cookiesPath);
    } else if (fs.existsSync(rootCookiesPath)) {
        args.push('--cookies', rootCookiesPath);
    } else {
        // Fallback: try to get cookies from common browsers if on local machine
        // Note: This might not work on headless/server environments without proper setup
        // args.push('--cookies-from-browser', 'chrome'); 
    }

    args.push(url);
    return args;
};

const buildYtDlpInfoCommand = (url, userAgent) => {
    const ytcmd = getYtDlpPath();
    const ua = userAgent || getRotatedUserAgent();
    let cmd = `"${ytcmd}" --dump-json --no-check-certificates --user-agent "${ua}"`;
    
    // Add referer
    try {
        const domain = new URL(url).hostname;
        cmd += ` --referer "https://${domain}/"`;
    } catch {}

    // Support cookies
    const cookiesPath = path.join(__dirname, 'cookies.txt');
    const rootCookiesPath = path.join(process.cwd(), 'cookies.txt');
    
    if (fs.existsSync(cookiesPath)) {
        cmd += ` --cookies "${cookiesPath}"`;
    } else if (fs.existsSync(rootCookiesPath)) {
        cmd += ` --cookies "${rootCookiesPath}"`;
    }

    cmd += ` "${url}"`;
    return cmd;
};

const safeJsonParse = (data, fallback) => {
    try {
        return JSON.parse(data);
    } catch {
        return fallback;
    }
};

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Bypass-Tunnel-Reminder'],
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// IN-MEMORY STATE
// ============================================================================

const progressMap = new Map();
const activeJobs = new Map();

// ============================================================================
// STARTUP CLEANUP
// ============================================================================

const performStartupCleanup = () => {
    console.log('[Startup] Cleaning up temporary files...');
    cleanupOldFiles(__dirname);
    
    const staleJobs = Array.from(activeJobs.entries()).filter(
        ([, job]) => Date.now() - job.createdAt > CONFIG.DOWNLOAD_TIMEOUT
    );
    
    staleJobs.forEach(([jobId, job]) => {
        console.log(`[Startup] Cleaning up stale job: ${jobId}`);
        try { job.child.kill('SIGKILL'); } catch {}
        cleanupDownloadArtifacts(job.outputPath);
        activeJobs.delete(jobId);
        progressMap.delete(jobId);
    });
};

// ============================================================================
// VIDEO DOWNLOADERS
// ============================================================================

/**
 * Get video formats with quality information
 * @param {string} url - Video URL
 * @returns {Promise<{title: string, duration: number, formats: Array, thumbnail: string}>}
 */
const getVideoFormats = async (url) => {
    const ytcmd = getYtDlpPath();
    const userAgent = getRotatedUserAgent();
    const command = buildYtDlpInfoCommand(url, userAgent);

    console.log(`[Formats] Fetching: ${url.substring(0, 80)}...`);

    try {
        const { stdout, stderr } = await execPromise(command, {
            maxBuffer: 1024 * 1024 * 50,
            timeout: CONFIG.DOWNLOAD_TIMEOUT,
        });

        if (stderr) console.log('[Formats STDERR]:', stderr.substring(0, 200));

        const videoData = safeJsonParse(stdout, null);
        if (!videoData) {
            throw new Error('Invalid response from yt-dlp');
        }

        // Process and filter formats
        const formats = [];
        const seenResolutions = new Set();

        // Group formats by resolution
        const formatGroups = new Map();

        (videoData.formats || []).forEach(f => {
            // Skip formats without video or audio
            if (f.vcodec === 'none' && f.acodec === 'none') return;

            // Determine resolution
            let resolution = 'Audio Only';
            if (f.vcodec !== 'none') {
                resolution = f.resolution || (f.width ? `${f.height}p` : 'Unknown');
                
                // Normalize resolution labels
                if (resolution.includes('x')) {
                    resolution = `${f.height}p`;
                }
            }

            // Calculate file size
            const filesize = f.filesize || f.filesize_approx || 0;
            const filesizeMB = filesize ? (filesize / (1024 * 1024)).toFixed(1) : '?';

            // Get quality info
            const quality = f.format_note || f.quality_label || '';
            const fps = f.fps ? `${f.fps}fps` : '';
            const vcodec = f.vcodec !== 'none' ? f.vcodec : '';
            const acodec = f.acodec !== 'none' ? f.acodec : '';

            const formatInfo = {
                format_id: f.format_id,
                resolution,
                extension: f.ext || 'unknown',
                filesize: filesizeMB,
                filesize_bytes: filesize,
                quality,
                fps,
                vcodec,
                acodec,
                tbr: f.tbr || 0,
                hasVideo: f.vcodec !== 'none',
                hasAudio: f.acodec !== 'none',
            };

            // Group by resolution
            if (!formatGroups.has(resolution)) {
                formatGroups.set(resolution, []);
            }
            formatGroups.get(resolution).push(formatInfo);
        });

        // Select best format for each resolution
        formatGroups.forEach((group, resolution) => {
            // Sort by bitrate (tbr) descending
            group.sort((a, b) => b.tbr - a.tbr);
            
            // Take the best format (highest bitrate)
            const best = group[0];
            
            // For video with audio, prefer formats that have both
            const withBoth = group.find(f => f.hasVideo && f.hasAudio);
            if (withBoth) {
                formats.push(withBoth);
            } else if (best) {
                formats.push(best);
            }
        });

        // Sort formats: video with audio first (by resolution), then audio only
        formats.sort((a, b) => {
            if (a.hasVideo && b.hasVideo) {
                // Sort by resolution (height)
                const aHeight = parseInt(a.resolution) || 0;
                const bHeight = parseInt(b.resolution) || 0;
                return bHeight - aHeight;
            }
            if (a.hasVideo && !b.hasVideo) return -1;
            if (!a.hasVideo && b.hasVideo) return 1;
            return 0;
        });

        // Limit to top 12 formats
        const limitedFormats = formats.slice(0, 12).map((f, index) => ({
            ...f,
            order: index,
        }));

        return {
            title: videoData.title || 'Video',
            duration: videoData.duration,
            thumbnail: videoData.thumbnail || videoData.thumbnail_url,
            formats: limitedFormats,
            webpage_url: videoData.webpage_url || url,
            uploader: videoData.uploader || videoData.channel || '',
        };
    } catch (error) {
        console.error('[Formats] Error:', error.message);
        throw error;
    }
};

const downloadWithYtDlp = async (url) => {
    const ytcmd = getYtDlpPath();
    const userAgent = getRotatedUserAgent();
    const command = buildYtDlpInfoCommand(url, userAgent);

    console.log(`[YtDlp] Fetching info: ${url.substring(0, 80)}...`);

    try {
        const { stdout, stderr } = await execPromise(command, {
            maxBuffer: 1024 * 1024 * 50,
            timeout: CONFIG.DOWNLOAD_TIMEOUT,
        });

        if (stderr) console.log('[YtDlp STDERR]:', stderr.substring(0, 300));

        const videoData = safeJsonParse(stdout, null);
        if (!videoData) {
            throw new Error('Invalid response from yt-dlp');
        }

        console.log('[YtDlp] Raw response keys:', Object.keys(videoData).slice(0, 20).join(', '));

        // Extract video URL - try multiple methods for different sites
        let videoUrl = '';

        // Method 1: Direct URL field
        if (videoData.url) {
            videoUrl = videoData.url;
            console.log('[YtDlp] URL from videoData.url');
        }
        // Method 2: requested_downloads array
        else if (videoData.requested_downloads && videoData.requested_downloads.length > 0) {
            videoUrl = videoData.requested_downloads[0].url || videoData.requested_downloads[0].manifest_url;
            console.log('[YtDlp] URL from requested_downloads');
        }
        // Method 3: formats array (for Instagram, TikTok, etc.)
        else if (videoData.formats && videoData.formats.length > 0) {
            // Find best video format with both video and audio
            const bestFormat = videoData.formats.find(f =>
                f.vcodec !== 'none' && f.acodec !== 'none' && f.url
            ) || videoData.formats.find(f => f.url);

            if (bestFormat) {
                videoUrl = bestFormat.url;
                console.log('[YtDlp] URL from formats array');
            }
        }
        // Method 4: entries array (for playlists)
        else if (videoData.entries && videoData.entries.length > 0) {
            const firstEntry = videoData.entries[0];
            videoUrl = firstEntry.url || firstEntry.requested_downloads?.[0]?.url;
            console.log('[YtDlp] URL from entries');
        }

        if (!videoUrl) {
            console.log('[YtDlp] Warning: No direct URL found, video may need direct download');
            // For Instagram and similar sites, we may need to download directly
            // Return the original URL and let the bot handle it with yt-dlp download
            videoUrl = url;
        }

        return {
            title: videoData.title || videoData.fullname || 'Video',
            url: videoUrl,
            thumbnail: videoData.thumbnail || videoData.thumbnail_url || null,
            type: 'yt-dlp',
            duration: videoData.duration,
            isM3U8: isM3U8(videoUrl),
            extractor: videoData.extractor,
        };
    } catch (error) {
        if (error.message && error.message.includes('timeout')) {
            throw new Error('yt-dlp request timed out');
        }
        throw error;
    }
};

const downloadM3U8WithYtDlp = async (url) => {
    const ytcmd = getYtDlpPath();
    const userAgent = getRotatedUserAgent();
    const command = `${ytcmd} --no-check-certificates --user-agent "${userAgent}" -f "best" --dump-json "${url}"`;
    
    console.log(`[M3U8-YtDlp] Processing: ${url}`);
    
    try {
        const { stdout, stderr } = await execPromise(command, {
            maxBuffer: 1024 * 1024 * 50,
            timeout: CONFIG.DOWNLOAD_TIMEOUT,
        });
        
        if (stderr) console.log('[M3U8-YtDlp STDERR]:', stderr.substring(0, 300));
        
        const videoData = safeJsonParse(stdout, null);
        if (!videoData) {
            throw new Error('Invalid response from yt-dlp');
        }
        
        return {
            title: videoData.title || 'M3U8 Stream',
            url: videoData.url || videoData.requested_downloads?.[0]?.url || '',
            thumbnail: videoData.thumbnail || null,
            type: 'm3u8_ytdlp',
            isM3U8: true,
        };
    } catch (error) {
        console.log('[M3U8-YtDlp] Error:', error.message);
        throw error;
    }
};

const sniffWithPlaywright = async (url) => {
    const userAgent = getRotatedUserAgent();
    console.log('[Playwright] Starting deep scan:', url);
    
    let browser = null;
    
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--allow-running-insecure-content',
                '--disable-blink-features=AutomationControlled',
            ],
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
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
            },
            viewport: { width: 1920, height: 1080 },
        });
        
        const foundVideos = [];
        
        const checkVideoUrl = (reqUrl, contentType = '') => {
            if (!reqUrl || reqUrl.startsWith('data:') || reqUrl.includes('advertisement')) return;
            
            // Skip tracking/analytics URLs
            if (reqUrl.includes('analytics') || reqUrl.includes('tracking') || reqUrl.includes('pixel')) return;
            
            if (reqUrl.includes('.m3u8') || contentType.includes('mpegurl')) {
                const isMaster = reqUrl.includes('master') || reqUrl.includes('index') || reqUrl.includes('playlist');
                foundVideos.push({ url: reqUrl, type: 'm3u8', priority: isMaster ? 25 : 10 });
                console.log('[Playwright] M3U8 found:', reqUrl.substring(0, 120));
            } else if (/\.mp4(\?|$|#)/i.test(reqUrl) || contentType.includes('video/mp4')) {
                const priority = reqUrl.includes('preview') || reqUrl.includes('thumb') ? 5 : 20;
                foundVideos.push({ url: reqUrl, type: 'mp4', priority });
                console.log('[Playwright] MP4 found:', reqUrl.substring(0, 120));
            } else if (/\.(webm|flv|ts|mkv|avi|mov)(\?|$|#)/i.test(reqUrl)) {
                foundVideos.push({ url: reqUrl, type: 'video', priority: 5 });
                console.log('[Playwright] Video stream found:', reqUrl.substring(0, 120));
            }
        };
        
        const page = await context.newPage();
        
        // Block unnecessary resources to speed up loading
        await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf,eot}', route => route.abort());
        
        page.on('response', async (response) => {
            try {
                const reqUrl = response.url();
                const contentType = response.headers()['content-type'] || '';
                checkVideoUrl(reqUrl, contentType);
            } catch {}
        });
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        
        const allFrames = page.frames();
        for (const frame of allFrames) {
            if (frame === page.mainFrame()) continue;
            try {
                const frameSrcs = await frame.evaluate(() => {
                    const srcs = [];
                    document.querySelectorAll('video, video source, source').forEach(v => {
                        if (v.src) srcs.push(v.src);
                        if (v.currentSrc) srcs.push(v.currentSrc);
                    });
                    const bodyText = document.body?.innerHTML || '';
                    const m3u8Match = bodyText.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
                    const mp4Match = bodyText.match(/(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/i);
                    if (m3u8Match) srcs.push(m3u8Match[1]);
                    if (mp4Match) srcs.push(mp4Match[1]);
                    return [...new Set(srcs)];
                }).catch(() => []);
                
                for (const src of frameSrcs) {
                    if (src && src.startsWith('http')) checkVideoUrl(src);
                }
            } catch {}
        }
        
        if (foundVideos.length === 0) {
            // Instagram-specific login or overlay handling
            if (url.includes('instagram.com')) {
                const loginCloseBtn = await page.$('div[role="dialog"] button:has-text("Close")').catch(() => null);
                if (loginCloseBtn) await loginCloseBtn.click().catch(() => {});
                
                // Try clicking the video to trigger playback if needed
                const instagramVideo = await page.$('video').catch(() => null);
                if (instagramVideo) {
                    await instagramVideo.click().catch(() => {});
                    await page.waitForTimeout(2000);
                }
            }

            const playSelectors = ['video', '.play-button', '[class*="play"]', '.vjs-big-play-button', '.jw-icon-display', '.plyr__control--overlaid'];
            for (const sel of playSelectors) {
                try {
                    const el = await page.$(sel);
                    if (el) {
                        await el.click({ timeout: 2000 });
                        console.log(`[Playwright] Clicked "${sel}"`);
                        await page.waitForTimeout(2000);
                        if (foundVideos.length > 0) break;
                    }
                } catch {}
            }
            await page.waitForTimeout(5000);
        }
        
        if (foundVideos.length === 0) {
            const videoSrcs = await page.evaluate(() => {
                const srcs = [];
                document.querySelectorAll('video, video source, source, embed, object').forEach(v => {
                    if (v.src) srcs.push(v.src);
                    if (v.currentSrc) srcs.push(v.currentSrc);
                    if (v.data) srcs.push(v.data);
                });
                const bodyText = document.body?.innerHTML || '';
                const m3u8Matches = bodyText.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || [];
                const mp4Matches = bodyText.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/gi) || [];
                srcs.push(...m3u8Matches, ...mp4Matches);
                return [...new Set(srcs)];
            }).catch(() => []);
            
            for (const src of videoSrcs) {
                if (src && src.startsWith('http')) checkVideoUrl(src);
            }
        }
        
        await browser.close();
        
        if (foundVideos.length === 0) {
            throw new Error('No video found on page');
        }
        
        const uniqueUrls = new Map();
        for (const v of foundVideos) {
            const cleanUrl = v.url.split('?')[0];
            if (!uniqueUrls.has(cleanUrl) || (uniqueUrls.get(cleanUrl)?.priority || 0) < v.priority) {
                uniqueUrls.set(cleanUrl, v);
            }
        }
        
        const sorted = [...uniqueUrls.values()].sort((a, b) => b.priority - a.priority);
        const best = sorted[0];
        
        console.log(`[Playwright] Selected: ${best.type} — ${best.url.substring(0, 120)}`);
        
        return {
            title: 'Universal Video',
            url: best.url,
            thumbnail: null,
            type: `playwright_${best.type}`,
            isM3U8: best.type === 'm3u8',
        };
    } catch (error) {
        if (browser) await browser.close().catch(() => {});
        throw error;
    }
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

app.post('/api/download', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ status: 'error', text: 'URL is required' });
        }
        
        if (!isValidUrl(url)) {
            return res.status(400).json({ status: 'error', text: 'Invalid URL format' });
        }
        
        console.log('\n[Download] New request:', url);
        
        if (isM3U8(url)) {
            console.log('[Type] M3U8 stream detected');
            try {
                const m3u8Data = await downloadM3U8WithYtDlp(url);
                return res.json({
                    status: 'success',
                    author: AUTHOR,
                    type: m3u8Data.type,
                    data: m3u8Data,
                });
            } catch {
                return res.json({
                    status: 'success',
                    author: AUTHOR,
                    type: 'm3u8_direct',
                    data: { title: 'M3U8 Stream', url, thumbnail: null, isM3U8: true },
                });
            }
        }
        
        if (isDirectVideo(url)) {
            console.log('[Type] Direct video URL');
            return res.json({
                status: 'success',
                author: AUTHOR,
                type: 'direct',
                data: { title: 'Video', url, thumbnail: null },
            });
        }
        
        try {
            const ytdlpData = await downloadWithYtDlp(url);
            return res.json({
                status: 'success',
                author: AUTHOR,
                type: ytdlpData.type,
                data: ytdlpData,
            });
        } catch (ytDlpError) {
            console.log('[YtDlp] Failed, trying Playwright...');
            try {
                const fallbackData = await sniffWithPlaywright(url);
                return res.json({
                    status: 'success',
                    author: AUTHOR,
                    type: fallbackData.type,
                    data: fallbackData,
                });
            } catch {
                throw new Error('Video not found. Check the URL and try again.');
            }
        }
    } catch (error) {
        console.error('[Download] Error:', error.message);
        res.status(500).json({ status: 'error', text: error.message });
    }
});

app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ status: 'error', text: 'URL is required' });
        
        console.log(`[Info] Fetching: ${url.substring(0, 80)}...`);
        const command = buildYtDlpInfoCommand(url);
        const { stdout } = await execPromise(command, { maxBuffer: 1024 * 1024 * 50 });
        const videoData = safeJsonParse(stdout, null);
        
        if (!videoData) throw new Error('Invalid response from yt-dlp');
        
        const formats = (videoData.formats || [])
            .filter(f => f.vcodec !== 'none' || f.acodec !== 'none')
            .map(f => ({
                format_id: f.format_id,
                extension: f.ext,
                resolution: f.resolution || (f.width ? `${f.width}x${f.height}` : 'audio only'),
                filesize: f.filesize || f.filesize_approx || null,
                quality: f.format_note || f.quality_label || '',
                tbr: f.tbr || 0,
            }))
            .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))
            .slice(0, 15);
        
        return res.json({
            status: 'success',
            data: {
                title: videoData.title,
                thumbnail: videoData.thumbnail,
                duration: videoData.duration,
                formats,
            },
        });
    } catch (error) {
        console.error('[Info] Error:', error.message);
        res.status(500).json({ status: 'error', text: error.message });
    }
});

app.get('/api/progress/:jobId', (req, res) => {
    const { jobId } = req.params;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    
    const sendProgress = () => {
        const state = progressMap.get(jobId);
        if (state) {
            res.write(`data: ${JSON.stringify(state.progress)}\n\n`);
            if (state.progress.status === 'completed' || state.progress.status === 'error') {
                res.end();
                return;
            }
        } else {
            res.write(`data: ${JSON.stringify({ status: 'error', message: 'Job not found' })}\n\n`);
            res.end();
        }
    };
    
    const interval = setInterval(sendProgress, 1000);
    sendProgress();
    
    req.on('close', () => clearInterval(interval));
    req.on('error', () => clearInterval(interval));
});

app.get('/api/proxy-download', async (req, res) => {
    const videoUrl = req.query.url;
    const title = req.query.title || 'video';
    const format = req.query.format || 'best';
    const jobId = req.query.jobId || generateJobId();
    
    if (!videoUrl) return res.status(400).json({ status: 'error', message: 'URL is required' });
    if (!isValidUrl(videoUrl)) return res.status(400).json({ status: 'error', message: 'Invalid URL format' });
    
    console.log(`\n[Proxy Download] Starting: [${jobId}] ${videoUrl.substring(0, 100)}`);
    
    const ytcmd = getYtDlpPath();
    const userAgent = getRotatedUserAgent();
    const safeTitle = sanitizeFilename(title);
    const fileName = `${safeTitle}_${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, fileName);
    
    const progress = { status: 'starting', percent: 0, speed: '', eta: '' };
    progressMap.set(jobId, { progress });
    
    try {
        const args = buildYtDlpArgs(videoUrl, outputPath, format, userAgent);
        console.log('[Proxy Download] Spawning yt-dlp...');
        const child = spawn(ytcmd, args);
        
        const job = { id: jobId, child, outputPath, title: safeTitle, createdAt: Date.now() };
        activeJobs.set(jobId, job);
        
        child.stdout.on('data', (data) => {
            const line = data.toString();
            const match = line.match(/\[download\]\s+(\d+\.\d+)%\s+of\s+([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/);
            if (match) {
                progressMap.set(jobId, {
                    progress: {
                        status: 'downloading',
                        percent: parseFloat(match[1]),
                        size: match[2],
                        speed: match[3],
                        eta: match[4],
                    },
                });
            }
        });
        
        child.stderr.on('data', (data) => console.error('[yt-dlp stderr]:', data.toString()));
        
        child.on('close', async (code) => {
            activeJobs.delete(jobId);
            
            if (code === 0 && fs.existsSync(outputPath)) {
                const stat = fs.statSync(outputPath);
                console.log(`[Proxy Download] Complete! Size: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
                
                progressMap.set(jobId, { progress: { status: 'completed', percent: 100 } });
                
                const state = progressMap.get(jobId);
                if (state) {
                    state.timeoutId = setTimeout(() => {
                        safeUnlink(outputPath);
                        progressMap.delete(jobId);
                        console.log(`[Proxy Download] Cleaned up: ${fileName}`);
                    }, 5000);
                }
                
                res.setHeader('Content-Type', 'video/mp4');
                res.setHeader('Content-Length', stat.size);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.mp4"`);
                res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
                
                const stream = fs.createReadStream(outputPath);
                stream.pipe(res);
                stream.on('end', () => stream.destroy());
                stream.on('error', () => {
                    safeUnlink(outputPath);
                    progressMap.delete(jobId);
                });
            } else {
                progressMap.set(jobId, { progress: { status: 'error', percent: 0, message: 'Download failed' } });
                if (!res.headersSent) res.status(500).json({ status: 'error', text: 'Download failed' });
                cleanupDownloadArtifacts(outputPath);
            }
        });
    } catch (error) {
        console.error('[Proxy Download] Error:', error.message);
        activeJobs.delete(jobId);
        progressMap.set(jobId, { progress: { status: 'error', percent: 0, message: error.message } });
        if (!res.headersSent) res.status(500).json({ status: 'error', text: error.message });
        cleanupDownloadArtifacts(outputPath);
    }
});

app.post('/api/cancel/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = activeJobs.get(jobId);
    
    if (!job) return res.status(404).json({ status: 'error', message: 'Job not found' });
    
    console.log(`[Cancel] Cancelling job: ${jobId}`);
    
    try { job.child.kill('SIGKILL'); } catch (e) {
        console.error('[Cancel] Error killing process:', e.message);
    }
    
    setTimeout(() => cleanupDownloadArtifacts(job.outputPath), 1000);
    activeJobs.delete(jobId);
    
    const state = progressMap.get(jobId);
    if (state && state.timeoutId) clearTimeout(state.timeoutId);
    
    progressMap.set(jobId, { progress: { status: 'error', percent: 0, message: 'Download cancelled' } });
    res.json({ status: 'success', message: 'Download cancelled' });
});

app.get('/', (_req, res) => {
    res.json({ status: 'ok', author: AUTHOR, version: '2.0.0', features: ['yt-dlp', 'm3u8', 'playwright', 'bypass', 'proxy-download'] });
});

app.use((err, _req, res, _next) => {
    console.error('[Global Error]', err.message);
    res.status(500).json({ status: 'error', text: 'Internal server error' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
    performStartupCleanup();
    
    app.listen(CONFIG.PORT, async () => {
        console.log('\n' + '='.repeat(40));
        console.log(`🚀 Universal Video Server v2.0.0`);
        console.log(`📡 Port: ${CONFIG.PORT}`);
        console.log(`📥 Supported: YouTube, TikTok, Instagram, M3U8, Direct URLs`);
        console.log(`🔓 Features: GEO-bypass, SSL-bypass, UA rotation`);
        console.log(`👤 Author: ${AUTHOR}`);
        console.log('='.repeat(40));
        console.log(`🌐 Local API: http://localhost:${CONFIG.PORT}/api/download`);
        
        const setupTunnel = async () => {
            try {
                console.log(`\n[Tunnel] Connecting to ${CONFIG.SUBDOMAIN}.loca.lt...`);
                const tunnel = await localtunnel({ port: CONFIG.PORT, subdomain: CONFIG.SUBDOMAIN });
                console.log('\n✅ TUNNEL READY!');
                console.log(`🔗 Public URL: ${tunnel.url}`);
                console.log('='.repeat(40) + '\n');
                
                tunnel.on('close', () => {
                    console.log('[Tunnel] Connection lost. Reconnecting in 5s...');
                    setTimeout(setupTunnel, 5000);
                });
                tunnel.on('error', (err) => {
                    console.error('[Tunnel] Error:', err.message);
                    tunnel.close();
                });
            } catch (error) {
                console.error('[Tunnel] Failed:', error.message);
                setTimeout(setupTunnel, 5000);
            }
        };
        
        setupTunnel();
    });
};

// Export for bot usage
module.exports = {
    downloadWithYtDlp,
    sniffWithPlaywright,
    getVideoFormats,
    isM3U8,
    isDirectVideo,
    getYtDlpPath,
    getRotatedUserAgent,
    buildYtDlpArgs,
    buildYtDlpInfoCommand,
    AUTHOR,
};

// Start server if run directly
if (require.main === module) {
    startServer().catch(console.error);
}
