# 🍪 Cookies Setup Guide

## Why Cookies Are Needed

Instagram, TikTok, and other platforms require authentication to access certain content:
- **Private accounts** - Need login to view
- **Age-restricted content** - Need verified account
- **Rate limiting** - Authenticated requests have higher limits
- **Cloudflare protection** - Cookies help bypass bot detection

## How to Get Cookies

### Method 1: Using Browser Extension (Easiest)

#### Chrome/Edge: "Get cookies.txt LOCALLY"

1. Install extension: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)

2. Go to Instagram.com and log in

3. Click the extension icon → Export → Save as `cookies.txt`

4. Place file in project root:
   ```
   social-media-downloader/
   ├── cookies.txt  ← Put it here
   ├── app/
   └── requirements.txt
   ```

#### Firefox: "cookies.txt"

1. Install add-on: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. Log in to Instagram/TikTok

3. Click extension → Export cookies

4. Save as `cookies.txt` in project root

### Method 2: Using Python Script

```python
# export_cookies.py
import browser_cookie3

# Export from Chrome
cookies = browser_cookie3.chrome(domain_name='instagram.com')

# Save to file
with open('cookies.txt', 'w') as f:
    for cookie in cookies:
        f.write(f"{cookie.domain}\tTRUE\t{cookie.path}\t{'TRUE' if cookie.secure else 'FALSE'}\t{cookie.expires}\t{cookie.name}\t{cookie.value}\n")
```

Install: `pip install browser_cookie3`

### Method 3: Using yt-dlp Helper

```bash
# Install cookies helper
pip install yt-dlp[default]

# This will prompt you to log in via browser
yt-dlp --cookies-from-browser chrome "https://instagram.com"
```

## Cookie File Format

The `cookies.txt` file should be in Netscape format:

```
# Netscape HTTP Cookie File
# https://curl.haxx.se/docs/http-cookies.html

.instagram.com	TRUE	/	TRUE	1735689600	sessionid	abc123xyz
.instagram.com	TRUE	/	TRUE	1735689600	csrftoken	def456uvw
.instagram.com	TRUE	/	TRUE	1735689600	ds_user_id	12345678
```

## Verifying Cookies Work

Test with this command:

```bash
yt-dlp --cookies cookies.txt "https://www.instagram.com/reel/TEST_ID/"
```

If it works, you'll see video info. If not, you'll get a login error.

## Refreshing Cookies

Cookies expire! Refresh them every 1-2 weeks:

1. Log out of Instagram in your browser
2. Log back in
3. Export cookies again
4. Replace `cookies.txt`
5. Restart the API server

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `cookies.txt` to Git (it's in .gitignore)
- Don't share your cookies file
- Cookies contain session tokens that can be used to access your account
- Use a secondary account for downloading if concerned about security

## Environment Variable

Set the cookies path:

```bash
# Linux/Mac
export COOKIES_FILE=/path/to/cookies.txt

# Windows
set COOKIES_FILE=C:\path\to\cookies.txt
```

Or place `cookies.txt` in the project root (default location).

## Troubleshooting

### "Cookie file not found"
- Check path in environment variable
- Ensure file is in project root
- Restart server after adding cookies

### "Cookie format invalid"
- Use Netscape format (export from browser extension)
- Don't use JSON format cookies

### "Cookies expired"
- Re-export cookies from browser
- Log out and back in to refresh

### "Still getting login required"
- Make sure you're logged in when exporting
- Try a different browser
- Check if account has two-factor authentication issues

## Platform-Specific Notes

### Instagram
- Most strict about authentication
- Requires: sessionid, csrftoken, ds_user_id
- Cookies last ~1-2 weeks

### TikTok
- Sometimes works without cookies
- Better success rate with cookies
- Requires: tt_webid, ttwid

### Twitter/X
- Some content available without login
- Sensitive content requires login
- Requires: auth_token

### YouTube
- Usually works without cookies
- Age-restricted content needs login
- Requires: LOGIN_INFO, SIDCC

---

**Quick Test:**
```bash
# If this works, your cookies are good!
yt-dlp --cookies cookies.txt "https://www.instagram.com/reel/C1234567890/"
```
