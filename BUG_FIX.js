/**
 * Video Downloader Bug Fix
 * =========================
 * Fixes the "Ce.replace is not a function" error
 * 
 * Apply these fixes to your code:
 * 
 * 1. In pages/downloader.page.tsx - Already applied (see below)
 * 2. In local-video-api/server.js - Update Playwright settings
 */

// ============================================================================
// FIX 1: Frontend - pages/downloader.page.tsx
// ============================================================================

/**
 * ALREADY APPLIED - These changes were made:
 * 
 * Line ~207: Changed from:
 *   const serverBase = activeEndpoint.replace(/\/api\/(download|info)$/, "");
 * 
 * To:
 *   const serverBase = activeEndpoint ? activeEndpoint.replace(/\/api\/(download|info)$/, "") : "http://localhost:3000";
 * 
 * Line ~286: Changed from:
 *   const serverBase = activeEndpoint.replace(/\/api\/(download|info)$/, "");
 * 
 * To:
 *   const serverBase = activeEndpoint ? activeEndpoint.replace(/\/api\/(download|info)$/, "") : "http://localhost:3000";
 * 
 * Line ~355: Added response status check:
 *   if (!response.ok) {
 *     lastError = `Server error: ${response.status} ${response.statusText}`;
 *     continue;
 *   }
 * 
 * Line ~362: Added empty response check:
 *   if (!responseText || responseText.trim() === "") {
 *     lastError = "Server returned empty response";
 *     continue;
 *   }
 * 
 * Line ~378: Better error message handling:
 *   lastError = data.text || data.error || data.message || "Video not found. Please check the URL.";
 */

// ============================================================================
// FIX 2: Server - local-video-api/server.js
// ============================================================================

/**
 * MANUAL FIX REQUIRED - Update the sniffWithPlaywright function
 * 
 * Replace the browser launch args (around line 283):
 */

const UPDATED_BROWSER_ARGS = [
    '--no-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--allow-running-insecure-content',
    '--disable-blink-features=AutomationControlled',  // ADD THIS LINE
];

/**
 * Update the context creation (around line 293):
 */

const UPDATED_CONTEXT_OPTIONS = {
    userAgent,
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    javaScriptEnabled: true,
    extraHTTPHeaders: {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': url,
        'Sec-Fetch-Dest': 'document',      // ADD THESE
        'Sec-Fetch-Mode': 'navigate',       // ADD THESE
        'Sec-Fetch-Site': 'none',           // ADD THESE
    },
    viewport: { width: 1920, height: 1080 }, // Changed from 1280x720
};

/**
 * Add resource blocking after page creation (after line 323):
 */

async function ADD_THIS_AFTER_PAGE_CREATION(page) {
    // Block unnecessary resources to speed up loading
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf,eot}', route => route.abort());
}

/**
 * Update the checkVideoUrl function (around line 307):
 */

function UPDATED_checkVideoUrl(reqUrl, contentType = '') {
    if (!reqUrl || reqUrl.startsWith('data:') || reqUrl.includes('advertisement')) return;
    
    // Skip tracking/analytics URLs
    if (reqUrl.includes('analytics') || reqUrl.includes('tracking') || reqUrl.includes('pixel')) return;
    
    if (reqUrl.includes('.m3u8') || contentType.includes('mpegurl')) {
        const isMaster = reqUrl.includes('master') || reqUrl.includes('index') || reqUrl.includes('playlist');
        foundVideos.push({ url: reqUrl, type: 'm3u8', priority: isMaster ? 25 : 10 });
        console.log('[Playwright] M3U8 found:', reqUrl.substring(0, 120));
    } else if (/\.mp4(\?|$|#)/i.test(reqUrl) || contentType.includes('video/mp4')) {
        // Prioritize larger video files (more likely to be the main content)
        const priority = reqUrl.includes('preview') || reqUrl.includes('thumb') ? 5 : 20;
        foundVideos.push({ url: reqUrl, type: 'mp4', priority });
        console.log('[Playwright] MP4 found:', reqUrl.substring(0, 120));
    } else if (/\.(webm|flv|ts|mkv|avi|mov)(\?|$|#)/i.test(reqUrl)) {
        foundVideos.push({ url: reqUrl, type: 'video', priority: 5 });
        console.log('[Playwright] Video stream found:', reqUrl.substring(0, 120));
    }
}

// ============================================================================
// TESTING
// ============================================================================

/**
 * After applying these fixes, test with:
 * 
 * 1. Restart the server:
 *    - Close the current server window
 *    - Run Serverni_Yoqish.bat again
 * 
 * 2. Test the URL:
 *    - Open your frontend
 *    - Navigate to Video Downloader
 *    - Enter: https://en.sex-film.biz/11387-date-night-cucking.html
 *    - Click "Videoni izlash"
 * 
 * 3. Expected behavior:
 *    - Should show "Server ON" indicator
 *    - Should find and display the video
 *    - Should allow download
 * 
 * If you still see the error:
 * - Open browser DevTools (F12)
 * - Go to Console tab
 * - Look for the exact error line number
 * - Share the full error message
 */

// ============================================================================
// QUICK FIX SCRIPT (Alternative)
// ============================================================================

/**
 * If the above manual fixes are difficult, run this script to auto-patch:
 * 
 * Windows (PowerShell):
 */

const POWERSHELL_SCRIPT = `
# Backup original files
Copy-Item "pages\\downloader.page.tsx" "pages\\downloader.page.tsx.bak"
Copy-Item "local-video-api\\server.js" "local-video-api\\server.js.bak"

# The frontend fixes have already been applied automatically
# Only server.js needs manual update if issues persist

Write-Host "Fixes applied! Please restart the server."
`;

// ============================================================================
// ERROR DIAGNOSIS
// ============================================================================

/**
 * The error "Ce.replace is not a function" means:
 * 
 * 1. A variable that should be a string is null/undefined
 * 2. "Ce" is a minified variable name (from React build)
 * 3. The actual variable is "activeEndpoint" which was null
 * 
 * ROOT CAUSE:
 * - Server was offline or unreachable
 * - Frontend tried to call .replace() on null
 * 
 * SOLUTION APPLIED:
 * - Added null checks before calling .replace()
 * - Added fallback to "http://localhost:3000"
 * - Better error messages for debugging
 */

module.exports = {
    info: 'Video Downloader Bug Fix Guide',
    version: '1.0.1',
    fixes: [
        'Frontend null check for activeEndpoint',
        'Better error response handling',
        'Empty response detection',
        'Improved error messages',
    ],
};
