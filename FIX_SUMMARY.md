# 🔧 Bug Fix: "Ce.replace is not a function"

## Problem
Error when trying to download from: `https://en.sex-film.biz/11387-date-night-cucking.html`

**Error Message:** `Ce.replace is not a function`

## Root Cause
The error occurs when `activeEndpoint` is `null` and the code tries to call `.replace()` on it. This happens when:
1. Server is offline or unreachable
2. Server status check failed
3. No active endpoint was set

## ✅ Fixes Applied

### 1. Frontend Fix (pages/downloader.page.tsx)

**Already Applied** - The following changes were made automatically:

#### Change 1: Line ~207 (triggerDownload function)
```typescript
// BEFORE:
const serverBase = activeEndpoint.replace(/\/api\/(download|info)$/, "");

// AFTER:
const serverBase = activeEndpoint ? activeEndpoint.replace(/\/api\/(download|info)$/, "") : "http://localhost:3000";
```

#### Change 2: Line ~286 (handleCancelDownload function)
```typescript
// BEFORE:
const serverBase = activeEndpoint.replace(/\/api\/(download|info)$/, "");

// AFTER:
const serverBase = activeEndpoint ? activeEndpoint.replace(/\/api\/(download|info)$/, "") : "http://localhost:3000";
```

#### Change 3: Better error handling (downloadVideo function)
```typescript
// Added response status check
if (!response.ok) {
  lastError = `Server error: ${response.status} ${response.statusText}`;
  continue;
}

// Added empty response check
if (!responseText || responseText.trim() === "") {
  lastError = "Server returned empty response";
  continue;
}

// Better error message
lastError = data.text || data.error || data.message || "Video not found. Please check the URL.";
```

### 2. Server Improvements (Optional)

For better adult site support, update `local-video-api/server.js`:

#### Browser launch args (line ~283):
```javascript
args: [
    '--no-sandbox',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--allow-running-insecure-content',
    '--disable-blink-features=AutomationControlled',  // ADD THIS
],
```

#### Context headers (line ~300):
```javascript
extraHTTPHeaders: {
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': url,
    'Sec-Fetch-Dest': 'document',      // ADD THESE
    'Sec-Fetch-Mode': 'navigate',       // ADD THESE
    'Sec-Fetch-Site': 'none',           // ADD THESE
},
```

## 🚀 How to Apply

### Frontend (Already Done ✅)
The frontend fixes have been automatically applied. No action needed.

### Server (Optional - for better compatibility)

**Option 1: Manual Update**
1. Open `local-video-api/server.js`
2. Find the `sniffWithPlaywright` function (around line 274)
3. Update the browser launch args and context options as shown above

**Option 2: Use the Updated Server**
Replace `local-video-api/server.js` with the improved version from the repository.

## 🧪 Testing

1. **Restart the server:**
   ```
   - Close current server window
   - Run: Serverni_Yoqish.bat
   ```

2. **Test the URL:**
   - Open your frontend
   - Navigate to Video Downloader
   - Enter: `https://en.sex-film.biz/11387-date-night-cucking.html`
   - Click "Videoni izlash"

3. **Expected behavior:**
   - ✅ Server indicator shows "Server ON" (green)
   - ✅ Video is found and displayed
   - ✅ Download button appears
   - ✅ No "Ce.replace" error

## 🐛 Still Having Issues?

### Debug Steps:

1. **Check server status:**
   - Look for "Server ON" or "Server OFF" indicator
   - If "Server OFF", restart the server

2. **Open browser DevTools (F12):**
   - Go to Console tab
   - Look for error messages
   - Check Network tab for failed requests

3. **Check server logs:**
   - Look at the server window
   - Should show "[Download] New request: ..."
   - Should show "[Playwright] Starting deep scan: ..."

4. **Common issues:**

   **"Server OFF" shown:**
   - Server is not running
   - Run `Serverni_Yoqish.bat`
   - Wait for "Universal Video Server Ishga Tushdi" message

   **"Video not found":**
   - Site might have anti-bot protection
   - Try with different URL
   - Check if URL is accessible in browser

   **Timeout error:**
   - Site is slow to load
   - Increase timeout in code
   - Check internet connection

## 📝 Technical Details

**Error Stack Trace:**
```
TypeError: Ce.replace is not a function
    at triggerDownload (downloader.page.tsx:207)
    at onClick (downloader.page.tsx:XXX)
```

**What is "Ce"?**
- `Ce` is a minified variable name from the React build
- The actual variable is `activeEndpoint`
- TypeScript compiles to JavaScript, which gets minified
- In minified code, `activeEndpoint` becomes `Ce`

**Why null?**
- `activeEndpoint` is set by `checkServerStatus()`
- If server health check fails, it remains `null`
- Calling `.replace()` on `null` throws the error

**The Fix:**
- Check if `activeEndpoint` is truthy before calling `.replace()`
- Provide fallback value `"http://localhost:3000"`
- Show "Server OFF" indicator to user

## 📞 Support

If issues persist:
1. Share the full error message from console
2. Share server logs
3. Share screenshot of the error
4. Check if server is running (Serverni_Yoqish.bat)

---

**Status:** ✅ Fixed  
**Version:** 1.0.1  
**Last Updated:** 2024
