/**
 * Universal Video Downloader API Server
 * Senior-level refactored version with TypeScript, proper error handling,
 * security hardening, and maintainable architecture
 * 
 * @author G'ulomov Akmal
 * @version 2.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import localtunnel from 'localtunnel';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import chromium from 'playwright';
import { 
  VideoData, 
  VideoFormat, 
  DownloadJob, 
  DownloadProgress,
  DownloadStatus,
  ApiResponse,
  DownloadRequest,
  InfoResponse,
  PlaywrightVideoResult,
  FoundVideo,
  VideoDownloaderError,
  VideoNotFoundError,
  InvalidUrlError,
  ServerConfig,
} from './types';
import {
  execPromise,
  getRotatedUserAgent,
  isM3U8,
  isDirectVideo,
  isValidUrl,
  sanitizeFilename,
  generateJobId,
  safeUnlink,
  cleanupDownloadArtifacts,
  cleanupOldFiles,
  getYtDlpPath,
  buildYtDlpArgs,
  buildYtDlpInfoArgs,
  formatErrorResponse,
  safeJsonParse,
  getServerConfig,
  AUTHOR,
} from './utils';

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
const config: ServerConfig = getServerConfig();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Bypass-Tunnel-Reminder'],
}));
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// IN-MEMORY STATE (Production: Use Redis)
// ============================================================================

interface ProgressState {
  progress: DownloadProgress;
  timeoutId?: NodeJS.Timeout;
}

const progressMap = new Map<string, ProgressState>();
const activeJobs = new Map<string, DownloadJob>();

// ============================================================================
// STARTUP CLEANUP
// ============================================================================

const performStartupCleanup = (): void => {
  console.log('[Startup] Cleaning up temporary files from previous sessions...');
  cleanupOldFiles(__dirname);
  
  // Clear stale progress states
  const staleJobs = Array.from(activeJobs.entries()).filter(
    ([, job]) => Date.now() - job.createdAt > config.downloadTimeout
  );
  
  staleJobs.forEach(([jobId, job]) => {
    console.log(`[Startup] Cleaning up stale job: ${jobId}`);
    try {
      job.child.kill('SIGKILL');
    } catch {}
    cleanupDownloadArtifacts(job.outputPath);
    activeJobs.delete(jobId);
    progressMap.delete(jobId);
  });
};

// ============================================================================
// VIDEO DOWNLOADERS
// ============================================================================

/**
 * Download video using yt-dlp (primary method)
 */
const downloadWithYtDlp = async (url: string): Promise<VideoData> => {
  const ytcmd = getYtDlpPath();
  const userAgent = getRotatedUserAgent();
  
  const command = buildYtDlpInfoArgs(url, userAgent);
  console.log(`[YtDlp] Fetching info: ${url.substring(0, 80)}...`);
  
  try {
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 1024 * 1024 * 50,
      timeout: config.downloadTimeout,
    });
    
    if (stderr) {
      console.log('[YtDlp STDERR]:', stderr.substring(0, 300));
    }
    
    const videoData = safeJsonParse<any>(stdout);
    
    if (!videoData) {
      throw new VideoDownloaderError('Invalid response from yt-dlp', 'PARSE_ERROR');
    }
    
    return {
      title: videoData.title || 'Video',
      url: videoData.url || videoData.requested_downloads?.[0]?.url || '',
      thumbnail: videoData.thumbnail || null,
      type: 'yt-dlp',
      duration: videoData.duration,
      isM3U8: isM3U8(videoData.url || ''),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new VideoDownloaderError('yt-dlp request timed out', 'TIMEOUT');
    }
    throw error;
  }
};

/**
 * Download M3U8 stream using yt-dlp
 */
const downloadM3U8WithYtDlp = async (url: string): Promise<VideoData> => {
  const ytcmd = getYtDlpPath();
  const userAgent = getRotatedUserAgent();
  
  const command = `${ytcmd} --no-check-certificates --user-agent "${userAgent}" -f "best" --dump-json "${url}"`;
  console.log(`[M3U8-YtDlp] Processing: ${url}`);
  
  try {
    const { stdout, stderr } = await execPromise(command, {
      maxBuffer: 1024 * 1024 * 50,
      timeout: config.downloadTimeout,
    });
    
    if (stderr) {
      console.log('[M3U8-YtDlp STDERR]:', stderr.substring(0, 300));
    }
    
    const videoData = safeJsonParse<any>(stdout);
    
    if (!videoData) {
      throw new VideoDownloaderError('Invalid response from yt-dlp', 'PARSE_ERROR');
    }
    
    return {
      title: videoData.title || 'M3U8 Stream',
      url: videoData.url || videoData.requested_downloads?.[0]?.url || '',
      thumbnail: videoData.thumbnail || null,
      type: 'm3u8_ytdlp',
      isM3U8: true,
    };
  } catch (error) {
    console.log('[M3U8-YtDlp] Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

/**
 * Advanced video detection using Playwright (fallback method)
 */
const sniffWithPlaywright = async (url: string): Promise<VideoData> => {
  const userAgent = getRotatedUserAgent();
  console.log('[Playwright] Starting deep scan:', url);
  
  let browser: any = null;
  
  try {
    browser = await chromium.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-running-insecure-content',
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
      },
      viewport: { width: 1280, height: 720 },
    });
    
    const foundVideos: FoundVideo[] = [];
    
    const checkVideoUrl = (reqUrl: string, contentType: string = ''): void => {
      if (!reqUrl || reqUrl.startsWith('data:') || reqUrl.includes('advertisement')) {
        return;
      }
      
      if (reqUrl.includes('.m3u8') || contentType.includes('mpegurl')) {
        const isMaster = reqUrl.includes('master') || reqUrl.includes('index');
        foundVideos.push({ url: reqUrl, type: 'm3u8', priority: isMaster ? 25 : 10 });
        console.log('[Playwright] M3U8 found:', reqUrl.substring(0, 120));
      } else if (/\.mp4(\?|$|#)/i.test(reqUrl) || contentType.includes('video/mp4')) {
        foundVideos.push({ url: reqUrl, type: 'mp4', priority: 20 });
        console.log('[Playwright] MP4 found:', reqUrl.substring(0, 120));
      } else if (/\.(webm|flv|ts|mkv|avi|mov)(\?|$|#)/i.test(reqUrl)) {
        foundVideos.push({ url: reqUrl, type: 'video', priority: 5 });
        console.log('[Playwright] Video stream found:', reqUrl.substring(0, 120));
      }
    };
    
    const page = await context.newPage();
    
    // Monitor network responses
    page.on('response', async (response: any) => {
      try {
        const reqUrl = response.url();
        const contentType = response.headers()['content-type'] || '';
        checkVideoUrl(reqUrl, contentType);
      } catch {}
    });
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Scan frames
    const allFrames = page.frames();
    for (const frame of allFrames) {
      if (frame === page.mainFrame()) continue;
      
      try {
        const frameSrcs = await frame.evaluate(() => {
          const srcs: string[] = [];
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
          if (src && src.startsWith('http')) {
            checkVideoUrl(src);
          }
        }
      } catch {}
    }
    
    // Try clicking play buttons if no video found
    if (foundVideos.length === 0) {
      const playSelectors = [
        'video', '.play-button', '[class*="play"]', '.vjs-big-play-button',
        '.jw-icon-display', '.plyr__control--overlaid',
      ];
      
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
    
    // Final DOM scan
    if (foundVideos.length === 0) {
      const videoSrcs = await page.evaluate(() => {
        const srcs: string[] = [];
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
        if (src && src.startsWith('http')) {
          checkVideoUrl(src);
        }
      }
    }
    
    await browser.close();
    
    if (foundVideos.length === 0) {
      throw new VideoNotFoundError('No video found on page');
    }
    
    // Deduplicate and select best
    const uniqueUrls = new Map<string, FoundVideo>();
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
      type: `playwright_${best.type}` as any,
      isM3U8: best.type === 'm3u8',
    };
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    throw error;
  }
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Main download endpoint
 */
app.post('/api/download', async (req: Request<{}, {}, DownloadRequest>, res: Response<ApiResponse<VideoData>>) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      throw new InvalidUrlError('URL is required');
    }
    
    if (!isValidUrl(url)) {
      throw new InvalidUrlError('Invalid URL format');
    }
    
    console.log('\n[Download] New request:', url);
    
    // Direct M3U8
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
        // Fallback to direct URL
        return res.json({
          status: 'success',
          author: AUTHOR,
          type: 'm3u8_direct',
          data: {
            title: 'M3U8 Stream',
            url,
            thumbnail: null,
            isM3U8: true,
          },
        });
      }
    }
    
    // Direct video URL
    if (isDirectVideo(url)) {
      console.log('[Type] Direct video URL');
      return res.json({
        status: 'success',
        author: AUTHOR,
        type: 'direct',
        data: {
          title: 'Video',
          url,
          thumbnail: null,
        },
      });
    }
    
    // Try yt-dlp first
    try {
      const ytdlpData = await downloadWithYtDlp(url);
      return res.json({
        status: 'success',
        author: AUTHOR,
        type: ytdlpData.type,
        data: ytdlpData,
      });
    } catch (ytDlpError) {
      console.log('[YtDlp] Failed, trying Playwright fallback...');
      
      try {
        const fallbackData = await sniffWithPlaywright(url);
        return res.json({
          status: 'success',
          author: AUTHOR,
          type: fallbackData.type,
          data: fallbackData,
        });
      } catch {
        throw new VideoNotFoundError('Video not found. Check the URL and try again.');
      }
    }
  } catch (error) {
    console.error('[Download] Error:', error instanceof Error ? error.message : String(error));
    
    const statusCode = error instanceof VideoDownloaderError ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      status: 'error',
      text: message,
    });
  }
});

/**
 * Get video info (formats, metadata)
 */
app.post('/api/info', async (req: Request<{}, {}, DownloadRequest>, res: Response<ApiResponse<InfoResponse>>) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      throw new InvalidUrlError('URL is required');
    }
    
    console.log(`[Info] Fetching: ${url.substring(0, 80)}...`);
    
    const command = buildYtDlpInfoArgs(url);
    const { stdout } = await execPromise(command, {
      maxBuffer: 1024 * 1024 * 50,
    });
    
    const videoData = safeJsonParse<any>(stdout);
    
    if (!videoData) {
      throw new VideoDownloaderError('Invalid response from yt-dlp', 'PARSE_ERROR');
    }
    
    const formats: VideoFormat[] = (videoData.formats || [])
      .filter((f: any) => f.vcodec !== 'none' || f.acodec !== 'none')
      .map((f: any) => ({
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
    console.error('[Info] Error:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      status: 'error',
      text: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * SSE Progress endpoint
 */
app.get('/api/progress/:jobId', (req: Request<{ jobId: string }>, res: Response) => {
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
  
  req.on('close', () => {
    clearInterval(interval);
  });
  
  req.on('error', () => {
    clearInterval(interval);
  });
});

/**
 * Proxy download endpoint (download through server)
 */
app.get('/api/proxy-download', async (req: Request<{}, {}, {}, { url?: string; title?: string; format?: string; jobId?: string }>, res: Response) => {
  const videoUrl = req.query.url;
  const title = req.query.title || 'video';
  const format = req.query.format || 'best';
  const jobId = req.query.jobId || generateJobId();
  
  if (!videoUrl) {
    return res.status(400).json({ status: 'error', message: 'URL is required' });
  }
  
  if (!isValidUrl(videoUrl)) {
    return res.status(400).json({ status: 'error', message: 'Invalid URL format' });
  }
  
  console.log(`\n[Proxy Download] Starting: [${jobId}] ${videoUrl.substring(0, 100)}`);
  
  const ytcmd = getYtDlpPath();
  const userAgent = getRotatedUserAgent();
  const safeTitle = sanitizeFilename(title);
  const fileName = `${safeTitle}_${Date.now()}.mp4`;
  const outputPath = path.join(__dirname, fileName);
  
  // Initialize progress state
  const progress: DownloadProgress = { status: 'starting', percent: 0, speed: '', eta: '' };
  progressMap.set(jobId, { progress });
  
  try {
    const args = buildYtDlpArgs(videoUrl, outputPath, format, userAgent);
    
    console.log('[Proxy Download] Spawning yt-dlp...');
    const child = spawn(ytcmd, args);
    
    // Store active job
    const job: DownloadJob = {
      id: jobId,
      child,
      outputPath,
      title: safeTitle,
      createdAt: Date.now(),
    };
    activeJobs.set(jobId, job);
    
    // Parse progress from stdout
    child.stdout.on('data', (data) => {
      const line = data.toString();
      const match = line.match(/\[download\]\s+(\d+\.\d+)%\s+of\s+([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/);
      
      if (match) {
        const newProgress: DownloadProgress = {
          status: 'downloading',
          percent: parseFloat(match[1]),
          size: match[2],
          speed: match[3],
          eta: match[4],
        };
        progressMap.set(jobId, { progress: newProgress });
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error('[yt-dlp stderr]:', data.toString());
    });
    
    child.on('close', async (code) => {
      activeJobs.delete(jobId);
      
      if (code === 0 && fs.existsSync(outputPath)) {
        const stat = fs.statSync(outputPath);
        console.log(`[Proxy Download] Complete! Size: ${(stat.size / 1024 / 1024).toFixed(1)} MB`);
        
        const completedProgress: DownloadProgress = { status: 'completed', percent: 100 };
        progressMap.set(jobId, { progress: completedProgress });
        
        // Set cleanup timeout
        const state = progressMap.get(jobId);
        if (state) {
          state.timeoutId = setTimeout(() => {
            safeUnlink(outputPath);
            progressMap.delete(jobId);
            console.log(`[Proxy Download] Cleaned up: ${fileName}`);
          }, 5000);
        }
        
        // Stream file to client
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeTitle)}.mp4"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        
        const stream = fs.createReadStream(outputPath);
        stream.pipe(res);
        
        stream.on('end', () => {
          stream.destroy();
        });
        
        stream.on('error', (err) => {
          console.error('[Proxy Download] Stream error:', err.message);
          safeUnlink(outputPath);
          progressMap.delete(jobId);
        });
      } else {
        const errorProgress: DownloadProgress = { 
          status: 'error', 
          percent: 0, 
          message: 'Download failed' 
        };
        progressMap.set(jobId, { progress: errorProgress });
        
        if (!res.headersSent) {
          res.status(500).json({ status: 'error', text: 'Download failed' });
        }
        
        cleanupDownloadArtifacts(outputPath);
      }
    });
  } catch (error) {
    console.error('[Proxy Download] Error:', error instanceof Error ? error.message : String(error));
    activeJobs.delete(jobId);
    progressMap.set(jobId, { 
      progress: { status: 'error', percent: 0, message: error instanceof Error ? error.message : 'Unknown error' } 
    });
    
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    }
    
    cleanupDownloadArtifacts(outputPath);
  }
});

/**
 * Cancel download endpoint
 */
app.post('/api/cancel/:jobId', (req: Request<{ jobId: string }>, res: Response) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ status: 'error', message: 'Job not found' });
  }
  
  console.log(`[Cancel] Cancelling job: ${jobId}`);
  
  try {
    job.child.kill('SIGKILL');
  } catch (error) {
    console.error('[Cancel] Error killing process:', error instanceof Error ? error.message : String(error));
  }
  
  // Cleanup files after delay
  setTimeout(() => {
    cleanupDownloadArtifacts(job.outputPath);
  }, 1000);
  
  activeJobs.delete(jobId);
  
  const state = progressMap.get(jobId);
  if (state && state.timeoutId) {
    clearTimeout(state.timeoutId);
  }
  
  progressMap.set(jobId, { 
    progress: { status: 'error', percent: 0, message: 'Download cancelled' } 
  });
  
  res.json({ status: 'success', message: 'Download cancelled' });
});

/**
 * Health check endpoint
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    author: AUTHOR, 
    version: '2.0.0',
    features: ['yt-dlp', 'm3u8', 'playwright', 'bypass', 'proxy-download'],
  });
});

/**
 * Global error handler
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({
    status: 'error',
    text: 'Internal server error',
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async (): Promise<void> => {
  performStartupCleanup();
  
  app.listen(config.port, async () => {
    console.log('\n' + '='.repeat(40));
    console.log(`🚀 Universal Video Server v2.0.0`);
    console.log(`📡 Port: ${config.port}`);
    console.log(`📥 Supported: YouTube, TikTok, Instagram, M3U8, Direct URLs`);
    console.log(`🔓 Features: GEO-bypass, SSL-bypass, UA rotation`);
    console.log(`👤 Author: ${AUTHOR}`);
    console.log('='.repeat(40));
    console.log(`🌐 Local API: http://localhost:${config.port}/api/download`);
    
    // Setup tunnel
    const setupTunnel = async (): Promise<void> => {
      try {
        console.log(`\n[Tunnel] Connecting to ${config.subdomain}.loca.lt...`);
        
        const tunnel = await localtunnel({
          port: config.port,
          subdomain: config.subdomain,
        });
        
        console.log('\n✅ TUNNEL READY!');
        console.log(`🔗 Public URL: ${tunnel.url}`);
        console.log('='.repeat(40) + '\n');
        
        tunnel.on('close', () => {
          console.log('[Tunnel] Connection lost. Reconnecting in 5s...');
          setTimeout(setupTunnel, 5000);
        });
        
        tunnel.on('error', (err: Error) => {
          console.error('[Tunnel] Error:', err.message);
          tunnel.close();
        });
      } catch (error) {
        console.error('[Tunnel] Failed to connect:', error instanceof Error ? error.message : String(error));
        console.log('Retrying in 5 seconds...');
        setTimeout(setupTunnel, 5000);
      }
    };
    
    setupTunnel();
  });
};

// Export for bot usage
export {
  downloadWithYtDlp,
  sniffWithPlaywright,
  isM3U8,
  isDirectVideo,
  getYtDlpPath,
  getRotatedUserAgent,
  AUTHOR,
};

// Start server if run directly
if (require.main === module) {
  startServer().catch(console.error);
}
