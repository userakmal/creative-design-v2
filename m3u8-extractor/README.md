# 🎯 Advanced M3U8 URL Extractor

Production-grade Python module for extracting hidden M3U8 URLs from complex video hosting sites using Playwright with anti-bot bypass techniques.

## ✨ Features

- **🕵️ Headless Browser Automation** - Chromium with stealth mode to bypass Cloudflare and other anti-bot protections
- **📡 Network Interception** - Real-time monitoring of XHR/Fetch requests for M3U8 detection
- **🖱️ Interaction Simulation** - Auto-clicks play buttons to trigger lazy-loaded video streams
- **🔄 Retry Logic** - Exponential backoff retry mechanism for reliability
- **🧹 Auto Cleanup** - Prevents zombie browser processes from consuming RAM
- **🎭 User-Agent Rotation** - Rotates browser fingerprints to avoid detection
- **⏱️ Timeout Management** - Configurable timeouts at every level
- **📦 FFmpeg Ready** - Returns URLs ready for direct FFmpeg download

## 📦 Installation

```bash
# Clone or navigate to your project
cd m3u8-extractor

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# (Optional) Install system dependencies (Linux)
playwright install-deps
```

## 🚀 Quick Start

### Basic Usage

```python
from extractor import get_m3u8_url

async def download_video():
    url = "https://example.com/video/123"
    
    try:
        # Extract M3U8 URL
        m3u8_url = await get_m3u8_url(url, headless=True, timeout=20000)
        print(f"Found: {m3u8_url}")
        
        # Pass to FFmpeg
        # subprocess.run(["ffmpeg", "-i", m3u8_url, "-c", "copy", "output.mp4"])
        
    except ValueError as e:
        print(f"Failed: {e}")

# Run
import asyncio
asyncio.run(download_video())
```

### Command Line

```bash
# Extract from a page
python extractor.py https://example.com/video/123

# Verbose output (debug mode)
python extractor.py https://example.com/video/123 --verbose

# Visible browser (for debugging)
python extractor.py https://example.com/video/123 --no-headless

# Get all found M3U8 URLs
python extractor.py https://example.com/video/123 --all

# JSON output (for scripting)
python extractor.py https://example.com/video/123 --json

# Custom timeout and retries
python extractor.py https://example.com/video/123 --timeout 30000 --retries 3
```

## 📖 Advanced Usage

### Custom Configuration

```python
from extractor import M3U8Extractor, ExtractorConfig

config = ExtractorConfig(
    headless=True,              # Run browser in headless mode
    stealth_mode=True,          # Apply anti-detection techniques
    page_load_timeout=30000,    # Page load timeout (ms)
    network_idle_timeout=15000, # Network idle timeout (ms)
    extraction_timeout=25000,   # Total extraction timeout (ms)
    wait_after_click=5000,      # Wait after interaction (ms)
    max_retries=3,              # Max retry attempts
    retry_delay=2.0,            # Base retry delay (seconds)
)

extractor = M3U8Extractor(config)
result = await extractor.extract("https://example.com/video/123")

if result.success:
    print(f"M3U8 URL: {result.m3u8_url}")
    print(f"All variants: {result.all_m3u8_urls}")
    print(f"Page title: {result.page_title}")
else:
    print(f"Error: {result.error_message}")
```

### Batch Processing

```python
import asyncio
from extractor import get_m3u8_url

async def extract_batch(urls):
    """Process multiple URLs concurrently"""
    
    async def extract_one(url):
        try:
            m3u8 = await get_m3u8_url(url, timeout=15000)
            return {"url": url, "m3u8": m3u8, "success": True}
        except Exception as e:
            return {"url": url, "error": str(e), "success": False}
    
    # Limit concurrency to 3 at a time
    semaphore = asyncio.Semaphore(3)
    
    async def limited(url):
        async with semaphore:
            return await extract_one(url)
    
    results = await asyncio.gather(*[limited(url) for url in urls])
    return results

# Usage
urls = [
    "https://example.com/video/1",
    "https://example.com/video/2",
    "https://example.com/video/3",
]

results = asyncio.run(extract_batch(urls))
for r in results:
    print(f"{'✅' if r['success'] else '❌'} {r['url']}")
```

### Integration with FFmpeg

```python
import asyncio
import subprocess
from extractor import get_m3u8_url

async def download_video(page_url: str, output_path: str):
    """Extract M3U8 and download with FFmpeg"""
    
    # Step 1: Extract M3U8 URL
    m3u8_url = await get_m3u8_url(page_url, headless=True)
    print(f"🎯 Extracted: {m3u8_url}")
    
    # Step 2: Download with FFmpeg
    cmd = [
        "ffmpeg",
        "-i", m3u8_url,
        "-c", "copy",
        "-bsf:a", "aac_adtstoasc",
        "-y",
        output_path,
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, stderr = await process.communicate()
    
    if process.returncode == 0:
        print(f"✅ Downloaded: {output_path}")
        return True
    else:
        print(f"❌ Failed: {stderr.decode()}")
        return False

# Usage
# asyncio.run(download_video("https://example.com/video/123", "output.mp4"))
```

## 🔧 How It Works

### 1. Browser Launch
- Launches headless Chromium with anti-detection flags disabled
- Applies stealth scripts to bypass bot detection
- Rotates user agents and viewport sizes

### 2. Network Interception
- Sets up response listener before navigation
- Monitors all XHR/Fetch requests
- Detects M3U8 by URL pattern (`.m3u8`) and content type (`application/vnd.apple.mpegurl`)

### 3. Interaction Simulation
- Waits for video player elements to load
- Scrolls page slightly (human behavior)
- Clicks play/load buttons with random offsets
- Presses spacebar as fallback
- Waits for network requests after interaction

### 4. URL Selection
- Prioritizes `master.m3u8` URLs (highest quality playlists)
- Falls back to longest URL (usually most complete)
- Deduplicates and filters out ads/analytics

### 5. Cleanup
- Closes browser even on errors
- Prevents zombie processes
- Clears memory references

## 🎯 Supported Sites

Works with most video hosting sites including:

- ✅ Custom video players
- ✅ JW Player
- ✅ Video.js
- ✅ Plyr
- ✅ Flowplayer
- ✅ Sites with Cloudflare protection
- ✅ Lazy-loaded video streams
- ✅ Click-to-play sites

## 📊 ExtractionResult Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | Extraction succeeded |
| `m3u8_url` | str | Best M3U8 URL found |
| `error_message` | str | Error if failed |
| `all_m3u8_urls` | List[str] | All variants found |
| `page_title` | str | Page title |
| `final_url` | str | Final URL (after redirects) |
| `metadata` | Dict | Additional info |

## ⚠️ Troubleshooting

### "No M3U8 URL found"

1. Increase timeout: `get_m3u8_url(url, timeout=30000)`
2. Run with visible browser to debug: `--no-headless`
3. Check if site requires login/cookies
4. Site may use different streaming format (DASH, etc.)

### "Timeout error"

1. Increase extraction timeout
2. Check internet connection
3. Site might be slow - increase `page_load_timeout`

### "Zombie processes"

The module has automatic cleanup, but if issues persist:

```bash
# Kill all Chrome processes
pkill -f chrome
pkill -f chromium

# Linux: Also clean up defunct processes
ps aux | grep defunct | grep chrome | awk '{print $2}' | xargs kill -9
```

### Cloudflare blocking

1. Enable stealth mode (default)
2. Use `--no-headless` for interactive sites
3. Add cookies if you have them
4. Consider using residential proxies

## 🔐 Ethics & Legal

This tool is for **educational purposes** and **legitimate use cases** only:

- ✅ Download your own content
- ✅ Archive public domain videos
- ✅ Personal offline viewing (where legal)
- ✅ Testing your own platforms

- ❌ Do not download copyrighted content without permission
- ❌ Do not redistribute downloaded content
- ❌ Do not use for commercial purposes without licenses

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📧 Support

For issues, questions, or contributions:

- Open an issue on GitHub
- Check existing issues for solutions
- Read the example_usage.py for more examples

---

**Built with ❤️ by Creative Design Uz Team**
