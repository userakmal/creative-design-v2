# 🚀 Quick Start Guide - M3U8 Extractor

Get started in 5 minutes!

## 📦 Installation (2 minutes)

```bash
# Navigate to the extractor folder
cd m3u8-extractor

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright browser (Chromium)
playwright install chromium

# Verify installation
python -c "from extractor import get_m3u8_url; print('✅ Ready!')"
```

## 🎯 Your First Extraction (1 minute)

### Option 1: Command Line (Easiest)

```bash
# Extract M3U8 from a page
python extractor.py "https://example.com/video/123"

# See all found URLs
python extractor.py "https://example.com/video/123" --all

# Debug with visible browser
python extractor.py "https://example.com/video/123" --no-headless --verbose
```

### Option 2: Python Script

```python
# Create a file: test.py
from extractor import get_m3u8_url
import asyncio

async def main():
    url = "https://example.com/video/123"
    m3u8_url = await get_m3u8_url(url)
    print(f"Found: {m3u8_url}")

asyncio.run(main())
```

Run it:
```bash
python test.py
```

## 📥 Download with FFmpeg (2 minutes)

### Install FFmpeg

**Windows:**
```bash
# Using winget
winget install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**Linux:**
```bash
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### Download Video

```bash
# Extract and download in one command
python ffmpeg_integration.py "https://example.com/video/123" --page -o video.mp4

# Or if you already have M3U8 URL
ffmpeg -i "https://cdn.example.com/video.m3u8" -c copy video.mp4
```

## 🔧 Common Scenarios

### Scenario 1: Site with Cloudflare Protection

```bash
# Use visible browser to pass Cloudflare check
python extractor.py "https://protected-site.com/video" --no-headless

# Then download
ffmpeg -i "extracted_url.m3u8" -c copy video.mp4
```

### Scenario 2: Site Requires Click to Play

```python
# The extractor auto-clicks play buttons
from extractor import get_m3u8_url

url = await get_m3u8_url("https://click-to-play.com/video")
# It will automatically click the play button!
```

### Scenario 3: Multiple Quality Variants

```bash
# Get all M3U8 URLs (master playlist + variants)
python extractor.py "https://site.com/video" --all --json

# Output:
# {
#   "urls": [
#     "https://cdn.com/master.m3u8",
#     "https://cdn.com/720p.m3u8",
#     "https://cdn.com/480p.m3u8"
#   ]
# }
```

### Scenario 4: Batch Download

```python
# batch_download.py
import asyncio
from extractor import get_m3u8_url
import subprocess

async def download_video(page_url, output):
    m3u8 = await get_m3u8_url(page_url)
    subprocess.run([
        "ffmpeg", "-i", m3u8, "-c", "copy", "-y", output
    ])

async def main():
    videos = [
        ("https://site.com/video/1", "video1.mp4"),
        ("https://site.com/video/2", "video2.mp4"),
        ("https://site.com/video/3", "video3.mp4"),
    ]
    
    for url, output in videos:
        await download_video(url, output)

asyncio.run(main())
```

Run it:
```bash
python batch_download.py
```

## 🐛 Troubleshooting

### "No module named 'playwright'"
```bash
pip install playwright
playwright install chromium
```

### "No M3U8 URL found"
1. Try with visible browser: `--no-headless`
2. Increase timeout: `--timeout 30000`
3. Enable verbose logging: `--verbose`
4. Site may use different format (DASH, etc.)

### "Timeout error"
```bash
# Increase timeout
python extractor.py "url" --timeout 60000

# Reduce retries for faster failure
python extractor.py "url" --retries 1
```

### "Zombie processes eating RAM"
```bash
# Windows
taskkill /F /IM chrome*

# Linux/Mac
pkill -f chrome
```

## 📖 Next Steps

1. **Read the full README** - `README.md` for all features
2. **Check examples** - `example_usage.py` for code samples
3. **Run tests** - `pytest test_extractor.py -v`
4. **Integrate with your app** - See `ffmpeg_integration.py`

## 💡 Pro Tips

### Tip 1: Save Extracted URLs
```bash
# Save to file
python extractor.py "url" --json > extracted.json

# Parse in script
import json
data = json.load(open("extracted.json"))
m3u8_url = data["url"]
```

### Tip 2: Test Multiple Sites
```python
sites = [
    "https://site1.com/video/123",
    "https://site2.com/watch/456",
    "https://site3.com/play/789",
]

for site in sites:
    try:
        url = await get_m3u8_url(site, timeout=15000)
        print(f"✅ {site}: {url}")
    except Exception as e:
        print(f"❌ {site}: {e}")
```

### Tip 3: Monitor Progress
```python
async def download_with_progress(m3u8_url, output):
    import asyncio
    
    process = await asyncio.create_subprocess_exec(
        "ffmpeg", "-i", m3u8_url, "-c", "copy", "-y", output,
        stderr=asyncio.subprocess.PIPE
    )
    
    async for line in process.stderr:
        line = line.decode().strip()
        if "time=" in line:
            print(f"📊 {line.split('time=')[1].split()[0]}")
    
    await process.wait()
```

## 🎓 Complete Example

Here's a complete working script:

```python
# complete_example.py
import asyncio
import subprocess
from pathlib import Path
from extractor import get_m3u8_url

async def main():
    # Configuration
    page_url = "https://example.com/video/123"
    output_file = "downloaded_video.mp4"
    
    print("🚀 Starting download workflow...")
    
    try:
        # Step 1: Extract M3U8 URL
        print("\n🔍 Step 1: Extracting M3U8 URL...")
        m3u8_url = await get_m3u8_url(
            page_url,
            headless=True,
            timeout=20000,
            retries=2,
        )
        print(f"✅ Found: {m3u8_url[:80]}...")
        
        # Step 2: Download with FFmpeg
        print(f"\n📥 Step 2: Downloading to {output_file}...")
        
        process = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-i", m3u8_url,
            "-c", "copy",
            "-bsf:a", "aac_adtstoasc",
            "-y",  # Overwrite
            output_file,
            stderr=asyncio.subprocess.PIPE,
        )
        
        # Monitor progress
        async for line in process.stderr:
            line = line.decode().strip()
            if "time=" in line:
                time_val = line.split("time=")[1].split()[0]
                speed = line.split("speed=")[1].split()[0] if "speed=" in line else "?"
                print(f"⏳ {time_val} @ {speed}", end="\r")
        
        await process.wait()
        
        # Step 3: Verify
        if process.returncode == 0:
            size = Path(output_file).stat().st_size / 1024 / 1024
            print(f"\n✅ Success! Saved: {output_file} ({size:.2f} MB)")
        else:
            print("\n❌ Download failed")
            
    except ValueError as e:
        print(f"❌ Extraction failed: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
```

Run it:
```bash
python complete_example.py
```

---

**Need Help?** Check `README.md` or open an issue.

**Happy Downloading! 🎉**
