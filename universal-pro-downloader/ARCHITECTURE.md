# 🏗️ Architecture Guide

Universal Pro Downloader API - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CLIENT REQUEST                                │
│                    POST /api/download { url }                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI LAYER                                  │
│  - Request validation (Pydantic)                                         │
│  - Rate limiting                                                         │
│  - Error handling                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      UNIVERSAL DOWNLOADER ROUTER                         │
│                   (Factory/Strategy Pattern)                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │  URL Analysis                                              │         │
│  │  - Domain detection                                        │         │
│  │  - Direct M3U8/MP4 check                                   │         │
│  │  - Force fallback flag                                     │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                    │                                     │
│              ┌─────────────────────┴─────────────────────┐              │
│              │                                           │              │
│              ▼                                           ▼              │
│  ┌───────────────────────┐                   ┌───────────────────────┐  │
│  │   yt-dlp Extractor    │                   │  Playwright Extractor │  │
│  │   (Primary Engine)    │                   │   (Fallback Engine)   │  │
│  │                       │                   │                       │  │
│  │   - 1000+ sites       │                   │   - Unknown sites     │  │
│  │   - Fast extraction   │                   │   - JS-heavy sites    │  │
│  │   - Cookie auth       │                   │   - Network intercept │  │
│  └───────────────────────┘                   └───────────────────────┘  │
│              │                                           │              │
│              └─────────────────────┬─────────────────────┘              │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │  M3U8 Detection                                            │         │
│  │  - If M3U8: Send to FFmpeg                                 │         │
│  │  - If direct URL: Return to client                         │         │
│  └────────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐       ┌───────────────────────┐
        │   FFmpeg Processor    │       │   Return Result       │
        │                       │       │                       │
        │   - Download .ts      │       │   - download_url      │
        │   - Merge chunks      │       │   - file_path         │
        │   - Convert to MP4    │       │   - metadata          │
        └───────────────────────┘       └───────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           RESPONSE TO CLIENT                             │
│  { success, data: { engine_used, download_url, metadata }, ... }        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### 1. Smart Router (`main.py`)

**Responsibility:** Factory/Strategy pattern implementation

```python
class UniversalDownloaderRouter:
    """
    Routes URLs to appropriate extraction engine
    """
    
    def extract(url, quality, force_fallback):
        # 1. Analyze URL
        if should_skip_ytdlp(url):
            return playwright.extract()
        
        # 2. Try yt-dlp first
        try:
            result = ytdlp.extract()
            if result.success:
                return result
        except:
            pass
        
        # 3. Fallback to Playwright
        return playwright.extract()
```

**Decision Logic:**

| Condition | Engine | Reason |
|-----------|--------|--------|
| Direct M3U8/MP4 URL | Playwright | Skip yt-dlp overhead |
| force_fallback=true | Playwright | User override |
| Known platform (YouTube, etc.) | yt-dlp | Optimized support |
| Unknown domain | yt-dlp → Playwright | Try fast first |
| yt-dlp fails | Playwright | Fallback |

### 2. yt-dlp Extractor (`extractors/ytdlp.py`)

**Responsibility:** Primary extraction engine

```python
class YtDlpExtractor(BaseExtractor):
    """
    Uses yt-dlp library for extraction
    - Supports 1000+ platforms
    - Fast and reliable
    - Cookie authentication
    """
    
    async def extract(url, quality):
        # 1. Configure yt-dlp options
        options = YtDlpOptions(
            quality=quality,
            cookies_file=COOKIES_FILE,
        )
        
        # 2. Extract info (no download)
        with YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=False)
        
        # 3. Return result
        return ExtractionResult(
            success=True,
            download_url=info.url,
            is_m3u8='.m3u8' in info.url,
            metadata={...},
        )
```

**Key Features:**
- Cookie authentication for Instagram
- Quality selection
- Geo-bypass
- Automatic retries

### 3. Playwright Extractor (`extractors/playwright.py`)

**Responsibility:** Fallback extraction using headless browser

```python
class PlaywrightExtractor(BaseExtractor):
    """
    Uses Playwright for browser automation
    - Intercepts network requests
    - Simulates user interaction
    - Finds hidden video URLs
    """
    
    async def extract(url, quality):
        # 1. Launch browser
        browser = await playwright.chromium.launch()
        page = await browser.new_page()
        
        # 2. Setup network interceptor
        page.on('response', lambda r: capture_video_urls(r))
        
        # 3. Navigate and wait
        await page.goto(url)
        await page.wait_for_load_state('networkidle')
        
        # 4. Try clicking play buttons
        if no_videos_found:
            await click_play_buttons()
        
        # 5. Return best URL
        return ExtractionResult(
            success=True,
            download_url=best_video_url,
            is_m3u8=best_video_type == 'm3u8',
        )
```

**Key Features:**
- Network request interception
- Play button simulation
- DOM scraping
- Timeout protection

### 4. FFmpeg Processor (`processors/ffmpeg.py`)

**Responsibility:** M3U8 stream processing

```python
class FFmpegProcessor:
    """
    Processes M3U8/HLS streams
    - Downloads .ts chunks
    - Merges into MP4
    - Converts formats
    """
    
    async def download_m3u8(m3u8_url, output_filename):
        # 1. Build FFmpeg command
        cmd = [
            'ffmpeg',
            '-i', m3u8_url,
            '-c', 'copy',
            '-bsf:a', 'aac_adtstoasc',
            '-y', output_path,
        ]
        
        # 2. Run async
        process = await asyncio.create_subprocess_exec(*cmd)
        await process.communicate()
        
        # 3. Return result
        return FFmpegResult(
            success=True,
            file_path=output_path,
            filesize=output_path.stat().st_size,
        )
```

**Key Features:**
- Stream copying (no re-encode)
- AAC audio fix for MP4
- Fast start for web
- Timeout protection

### 5. Cleanup Service (`utils/cleanup.py`)

**Responsibility:** Background file cleanup

```python
class CleanupService:
    """
    Periodic cleanup of temporary files
    """
    
    async def start_periodic_cleanup():
        while running:
            await asyncio.sleep(3600)  # Every hour
            await cleanup_old_files()
    
    async def cleanup_old_files():
        for file in download_dir:
            if file.age > retention_seconds:
                file.unlink()
```

**Key Features:**
- Configurable retention
- Multiple file extensions
- Background execution
- Error handling

## Data Flow

### Success Flow (yt-dlp)

```
Client → POST /api/download
    │
    ▼
FastAPI validates request
    │
    ▼
Router: Analyze URL → yt-dlp domain
    │
    ▼
YtDlpExtractor.extract()
    │
    ▼
yt-dlp extracts info
    │
    ▼
Result: download_url found
    │
    ▼
No M3U8 → Return direct URL
    │
    ▼
Client receives response
```

### Success Flow (Playwright + FFmpeg)

```
Client → POST /api/download
    │
    ▼
FastAPI validates request
    │
    ▼
Router: yt-dlp fails → Fallback
    │
    ▼
PlaywrightExtractor.extract()
    │
    ▼
Browser intercepts M3U8 URL
    │
    ▼
Result: is_m3u8=true
    │
    ▼
FFmpegProcessor.download_m3u8()
    │
    ▼
FFmpeg downloads & merges
    │
    ▼
Result: file_path
    │
    ▼
Client receives file path
```

### Error Flow

```
Client → POST /api/download
    │
    ▼
Router: Try yt-dlp
    │
    ▼
yt-dlp: UnsupportedError
    │
    ▼
Router: Try Playwright
    │
    ▼
Playwright: Timeout
    │
    ▼
Router: All methods failed
    │
    ▼
Return error response
    │
    ▼
Client: { success: false, error: "..." }
```

## Concurrency Model

```
┌─────────────────────────────────────────────────────────┐
│                    Event Loop                            │
│                                                          │
│  Request 1 ──┐                                          │
│              │                                           │
│  Request 2 ──┼──► Async I/O (non-blocking)              │
│              │                                           │
│  Request 3 ──┤                                           │
│              │                                           │
│  Request N ──┘                                           │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │  Thread Pool (for blocking operations)       │       │
│  │  - yt-dlp extraction (run_in_executor)       │       │
│  │  - File I/O                                  │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

| Layer | Errors Handled | Response |
|-------|---------------|----------|
| FastAPI | Validation, HTTP | 400, 404, 500 |
| Router | Engine failures | Fallback logic |
| yt-dlp | Site errors | Parse specific messages |
| Playwright | Timeout, browser | Graceful degradation |
| FFmpeg | Processing errors | Return error |
| Cleanup | File errors | Log and continue |

## Security Considerations

1. **Input Validation**
   - Pydantic validates all inputs
   - URL parsing prevents injection
   - File path sanitization

2. **Resource Limits**
   - Timeouts on all operations
   - Max file size limits
   - Rate limiting per IP

3. **File Cleanup**
   - Automatic deletion
   - Retention policies
   - Prevents disk exhaustion

4. **Cookie Security**
   - Never commit cookies.txt
   - Secure storage recommended
   - Regular rotation

## Performance Optimization

1. **Async I/O**
   - Non-blocking network requests
   - Concurrent request handling
   - Thread pool for blocking ops

2. **Caching**
   - Cookie file validation
   - Browser instance reuse
   - FFmpeg path caching

3. **Resource Management**
   - Browser cleanup
   - File handle management
   - Memory-efficient streaming

## Monitoring Points

1. **Metrics to Track**
   - Request rate
   - Success/failure rate
   - Average processing time
   - Disk usage
   - Memory usage

2. **Logs to Monitor**
   - Extraction failures
   - Timeout errors
   - Cleanup operations
   - FFmpeg errors

3. **Alerts**
   - High error rate
   - Disk space low
   - Long processing times
   - Service unavailable

---

**Architecture Version:** 3.0.0  
**Last Updated:** 2024
