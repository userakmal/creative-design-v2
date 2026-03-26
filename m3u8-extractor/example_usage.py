"""
Example Usage - M3U8 Extractor
===============================
Demonstrates how to integrate the M3U8 extractor with your video downloader.
"""

import asyncio
from extractor import M3U8Extractor, ExtractorConfig, get_m3u8_url


# ============================================================================
# EXAMPLE 1: Simple Usage
# ============================================================================

async def example_simple():
    """Simple one-liner extraction"""
    
    url = "https://example.com/video/123"
    
    try:
        m3u8_url = await get_m3u8_url(url, headless=True, timeout=20000)
        print(f"✅ Found: {m3u8_url}")
        
        # Pass to your FFmpeg downloader
        # download_with_ffmpeg(m3u8_url)
        
    except ValueError as e:
        print(f"❌ Failed: {e}")


# ============================================================================
# EXAMPLE 2: Advanced Usage with Custom Config
# ============================================================================

async def example_advanced():
    """Advanced usage with full control"""
    
    config = ExtractorConfig(
        headless=True,
        stealth_mode=True,
        page_load_timeout=30000,
        network_idle_timeout=15000,
        extraction_timeout=25000,
        wait_after_click=5000,
        max_retries=3,
        retry_delay=2.0,
    )
    
    extractor = M3U8Extractor(config)
    
    url = "https://example.com/video/456"
    result = await extractor.extract(url)
    
    if result.success:
        print(f"✅ Success!")
        print(f"   URL: {result.m3u8_url}")
        print(f"   Title: {result.page_title}")
        print(f"   All variants: {len(result.all_m3u8_urls)}")
        
        # Download with FFmpeg
        # await download_with_ffmpeg(result.m3u8_url)
    else:
        print(f"❌ Failed: {result.error_message}")


# ============================================================================
# EXAMPLE 3: Batch Processing
# ============================================================================

async def example_batch():
    """Process multiple URLs concurrently"""
    
    urls = [
        "https://example.com/video/1",
        "https://example.com/video/2",
        "https://example.com/video/3",
    ]
    
    async def extract_one(url):
        try:
            m3u8_url = await get_m3u8_url(url, timeout=15000)
            return {"url": url, "m3u8": m3u8_url, "success": True}
        except Exception as e:
            return {"url": url, "error": str(e), "success": False}
    
    # Process concurrently (limit to 3 at a time)
    semaphore = asyncio.Semaphore(3)
    
    async def limited_extract(url):
        async with semaphore:
            return await extract_one(url)
    
    results = await asyncio.gather(*[limited_extract(url) for url in urls])
    
    for result in results:
        if result["success"]:
            print(f"✅ {result['url']}: {result['m3u8']}")
        else:
            print(f"❌ {result['url']}: {result['error']}")


# ============================================================================
# EXAMPLE 4: Integration with FFmpeg Downloader
# ============================================================================

async def download_with_ffmpeg(m3u8_url: str, output_path: str):
    """Download M3U8 stream using FFmpeg"""
    import subprocess
    
    cmd = [
        "ffmpeg",
        "-i", m3u8_url,
        "-c", "copy",
        "-bsf:a", "aac_adtstoasc",
        "-y",  # Overwrite output file
        output_path,
    ]
    
    print(f"📥 Downloading: {m3u8_url}")
    print(f"💾 Saving to: {output_path}")
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    
    stdout, stderr = await process.communicate()
    
    if process.returncode == 0:
        print(f"✅ Download complete: {output_path}")
        return True
    else:
        print(f"❌ Download failed: {stderr.decode()}")
        return False


async def example_with_download():
    """Extract and download in one flow"""
    
    url = "https://example.com/video/789"
    output_path = "output.mp4"
    
    try:
        # Step 1: Extract M3U8 URL
        m3u8_url = await get_m3u8_url(url, headless=True)
        print(f"🎯 Extracted: {m3u8_url}")
        
        # Step 2: Download with FFmpeg
        success = await download_with_ffmpeg(m3u8_url, output_path)
        
        if success:
            print(f"🎉 All done! Video saved to: {output_path}")
        
    except ValueError as e:
        print(f"❌ Extraction failed: {e}")


# ============================================================================
# EXAMPLE 5: Error Handling & Retry Logic
# ============================================================================

async def example_with_retry():
    """Custom retry logic with exponential backoff"""
    import time
    
    url = "https://example.com/video/retry-test"
    max_attempts = 5
    base_delay = 2.0
    
    for attempt in range(1, max_attempts + 1):
        print(f"\n🔄 Attempt {attempt}/{max_attempts}")
        
        try:
            m3u8_url = await get_m3u8_url(url, timeout=20000, retries=0)
            print(f"✅ Success on attempt {attempt}!")
            print(f"   URL: {m3u8_url}")
            return m3u8_url
            
        except ValueError as e:
            print(f"❌ Failed: {e}")
            
            if attempt < max_attempts:
                delay = base_delay * (2 ** (attempt - 1))  # Exponential backoff
                print(f"⏳ Waiting {delay}s before retry...")
                await asyncio.sleep(delay)
            else:
                print(f"❌ All attempts failed")
                raise
    
    return None


# ============================================================================
# EXAMPLE 6: Site-Specific Selectors
# ============================================================================

async def example_custom_selectors():
    """Example: Add site-specific logic for difficult sites"""
    
    from extractor import M3U8Extractor, ExtractorConfig
    
    config = ExtractorConfig(headless=True)
    extractor = M3U8Extractor(config)
    
    url = "https://difficult-site.com/video/123"
    
    async with extractor._create_browser() as (browser, context):
        page = await context.new_page()
        
        # Apply stealth
        await extractor._setup_network_listener(page)
        
        # Navigate
        await page.goto(url, wait_until="domcontentloaded")
        
        # Site-specific: Wait for specific element
        try:
            await page.wait_for_selector(".custom-video-player", timeout=5000)
            
            # Site-specific: Click a specific button
            await page.click("#custom-play-button")
            
            # Wait for M3U8 to appear in network
            await asyncio.sleep(5.0)
            
        except Exception as e:
            print(f"Custom handling failed: {e}")
        
        # Check results
        if extractor.found_m3u8_urls:
            print(f"✅ Found: {list(extractor.found_m3u8_urls)}")


# ============================================================================
# RUN EXAMPLES
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("M3U8 Extractor - Examples")
    print("=" * 60)
    
    # Run desired example
    # asyncio.run(example_simple())
    # asyncio.run(example_advanced())
    # asyncio.run(example_batch())
    # asyncio.run(example_with_download())
    # asyncio.run(example_with_retry())
    # asyncio.run(example_custom_selectors())
    
    print("\n💡 Uncomment an example to run it")
