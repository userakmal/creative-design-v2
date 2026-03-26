# 🎯 M3U8 Extractor - Complete Module Documentation

## 📁 Module Structure

```
m3u8-extractor/
├── extractor.py           # Main extraction module
├── ffmpeg_integration.py  # FFmpeg downloader integration
├── example_usage.py       # Usage examples
├── test_extractor.py      # Test suite
├── setup.py              # Package installation
├── requirements.txt      # Dependencies
├── README.md             # Full documentation
├── QUICKSTART.md         # Quick start guide
└── .gitignore           # Git ignore rules
```

## 🎯 What This Module Does

This module extracts hidden **M3U8/HLS stream URLs** from video hosting sites that:
- Hide the video URL behind JavaScript
- Require user interaction (click to play)
- Use anti-bot protection (Cloudflare, etc.)
- Load videos dynamically after page load

### How It Works

1. **Launches headless browser** with stealth mode
2. **Monitors network traffic** for M3U8 requests
3. **Clicks play buttons** to trigger video loading
4. **Extracts the M3U8 URL** from network requests
5. **Returns the URL** for FFmpeg download

## 🔧 Installation

```bash
cd m3u8-extractor

# Install dependencies
pip install -r requirements.txt

# Install browser
playwright install chromium

# Test installation
python -c "from extractor import get_m3u8_url; print('✅ Ready')"
```

## 📖 Usage Examples

### 1. Simple Extraction

```python
from extractor import get_m3u8_url

url = await get_m3u8_url("https://example.com/video/123")
print(f"M3U8 URL: {url}")
```

### 2. Command Line

```bash
python extractor.py "https://example.com/video/123"
```

### 3. With FFmpeg Download

```python
from extractor import get_m3u8_url
import subprocess

# Extract
m3u8 = await get_m3u8_url("https://example.com/video/123")

# Download
subprocess.run([
    "ffmpeg", "-i", m3u8, "-c", "copy", "video.mp4"
])
```

### 4. Batch Processing

```python
from extractor import get_m3u8_url
import asyncio

async def batch(urls):
    for url in urls:
        m3u8 = await get_m3u8_url(url)
        print(f"{url} → {m3u8}")

asyncio.run(batch([...]))
```

## 🎭 Key Features

### Stealth Mode
- Rotates user agents
- Bypasses navigator.webdriver detection
- Randomizes viewport size
- Spoofs WebGL fingerprints

### Network Interception
- Monitors all XHR/Fetch requests
- Detects M3U8 by URL pattern and content-type
- Filters out ads and analytics

### Interaction Simulation
- Auto-clicks play buttons
- Scrolls page (human behavior)
- Presses spacebar as fallback
- Waits for network after interaction

### Error Handling
- Automatic retry with backoff
- Timeout at every level
- Cleanup prevents zombie processes
- Detailed error messages

## 📊 API Reference

### `get_m3u8_url(page_url, headless=True, timeout=20000, retries=2)`

Extract M3U8 URL from a page.

**Args:**
- `page_url` (str): Page URL to extract from
- `headless` (bool): Run browser in headless mode
- `timeout` (int): Extraction timeout in milliseconds
- `retries` (int): Number of retry attempts

**Returns:** `str` - The extracted M3U8 URL

**Raises:** `ValueError` if extraction fails

### `get_all_m3u8_urls(page_url, headless=True, timeout=20000)`

Get all M3U8 URLs found (master playlist + variants).

**Returns:** `List[str]` - All found M3U8 URLs

### `class M3U8Extractor(config=None)`

Advanced extractor with full configuration control.

**Args:**
- `config` (ExtractorConfig): Configuration object

**Methods:**
- `extract(url) → ExtractionResult` - Extract from page

### `class ExtractorConfig(...)`

Configuration options.

**Fields:**
- `headless` (bool): Run browser in headless mode
- `stealth_mode` (bool): Apply anti-detection
- `page_load_timeout` (int): Page load timeout (ms)
- `network_idle_timeout` (int): Network idle timeout (ms)
- `extraction_timeout` (int): Total extraction timeout (ms)
- `wait_after_click` (int): Wait after interaction (ms)
- `max_retries` (int): Max retry attempts
- `retry_delay` (float): Base retry delay (seconds)

### `class ExtractionResult`

Extraction result.

**Fields:**
- `success` (bool): Extraction succeeded
- `m3u8_url` (str): Best M3U8 URL found
- `error_message` (str): Error if failed
- `all_m3u8_urls` (List[str]): All variants found
- `page_title` (str): Page title
- `final_url` (str): Final URL (after redirects)
- `metadata` (Dict): Additional info

## 🎬 FFmpeg Integration

Use `ffmpeg_integration.py` for complete download workflow:

```python
from ffmpeg_integration import download_from_url

success = await download_from_url(
    "https://example.com/video/123",
    "output.mp4"
)
```

Or use FFmpeg directly:

```bash
ffmpeg -i "https://cdn.example.com/video.m3u8" \
       -c copy \
       -bsf:a aac_adtstoasc \
       video.mp4
```

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest test_extractor.py -v

# Run specific test
pytest test_extractor.py::TestM3U8Extractor::test_m3u8_detection -v
```

## 🐛 Troubleshooting

### No M3U8 URL Found

1. Increase timeout: `get_m3u8_url(url, timeout=30000)`
2. Use visible browser: `headless=False`
3. Enable verbose logging: `--verbose` flag
4. Site may use different format (DASH, etc.)

### Timeout Errors

```python
config = ExtractorConfig(
    extraction_timeout=60000,  # 60 seconds
    page_load_timeout=45000,   # 45 seconds
)
```

### Zombie Processes

The module has automatic cleanup, but if needed:

```bash
# Windows
taskkill /F /IM chrome*

# Linux/Mac
pkill -f chrome
```

## 🔐 Ethics & Legal

**Allowed:**
- ✅ Download your own content
- ✅ Archive public domain videos
- ✅ Personal offline viewing (where legal)

**Not Allowed:**
- ❌ Download copyrighted content without permission
- ❌ Redistribute downloaded content
- ❌ Commercial use without licenses

## 📈 Performance

| Metric | Value |
|--------|-------|
| Extraction Time | 5-20 seconds |
| Memory Usage | ~100MB per extraction |
| Success Rate | ~85% (varies by site) |
| Concurrent Limit | 3-5 simultaneous |

## 🔄 Comparison

| Method | Speed | Success Rate | Stealth |
|--------|-------|--------------|---------|
| **This Module** | Medium | High | Excellent |
| requests + regex | Fast | Low | None |
| Selenium | Slow | Medium | Poor |
| yt-dlp | Fast | Medium | Good |

## 🚀 Advanced Usage

### Custom Selectors for Difficult Sites

```python
from extractor import M3U8Extractor, ExtractorConfig

config = ExtractorConfig(headless=True)
extractor = M3U8Extractor(config)

async with extractor._create_browser() as (browser, context):
    page = await context.new_page()
    await extractor._setup_network_listener(page)
    
    await page.goto("https://difficult-site.com")
    
    # Custom interaction
    await page.wait_for_selector(".custom-player")
    await page.click("#custom-play")
    await asyncio.sleep(5)
    
    # Get results
    if extractor.found_m3u8_urls:
        print(list(extractor.found_m3u8_urls))
```

### Add Custom Headers

```python
config = ExtractorConfig(headless=True)
extractor = M3U8Extractor(config)

async with extractor._create_browser() as (browser, context):
    # Add cookies
    await context.add_cookies([
        {"name": "session", "value": "abc123", "domain": "example.com"},
    ])
    
    page = await context.new_page()
    # ... rest of extraction
```

## 📚 Dependencies

- **playwright** (>=1.40.0) - Browser automation
- **ffmpeg** (optional) - Video download
- **pytest** (optional) - Testing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📧 Support

- **Documentation:** `README.md`
- **Quick Start:** `QUICKSTART.md`
- **Examples:** `example_usage.py`
- **Issues:** GitHub Issues

## 📄 License

MIT License - See LICENSE file.

---

**Built with ❤️ by Creative Design Uz Team**

**Version:** 1.0.0  
**Last Updated:** 2024
