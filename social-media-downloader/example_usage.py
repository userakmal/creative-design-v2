"""
Example Usage - Social Media Downloader API
============================================
Demonstrates how to use the API from frontend or other services.
"""

import asyncio
import httpx
from pathlib import Path

# API Configuration
API_BASE_URL = "http://localhost:8000"

# ============================================================================
# EXAMPLE 1: Extract Video Info (Without Downloading)
# ============================================================================

async def extract_video_info():
    """Get video metadata without downloading"""
    
    url = "https://www.instagram.com/reel/C1234567890/"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_BASE_URL}/extract",
            json={
                "url": url,
                "quality": "best",
                "format": "mp4"
            },
            timeout=30.0
        )
        
        data = response.json()
        
        if data["success"]:
            video = data["data"]
            print(f"✅ Platform: {video['platform']}")
            print(f"📹 Title: {video['title']}")
            print(f"👤 Uploader: {video['uploader']}")
            print(f"⏱️ Duration: {video['duration']}s")
            print(f"👁️ Views: {video['view_count']}")
            
            if video.get('download_url'):
                print(f"🔗 Direct URL: {video['download_url']}")
        else:
            print(f"❌ Error: {data['message']}")

# ============================================================================
# EXAMPLE 2: Download Video to Server
# ============================================================================

async def download_video():
    """Download video to server storage"""
    
    url = "https://www.tiktok.com/@user/video/1234567890"
    
    async with httpx.AsyncClient() as client:
        # Start download
        response = await client.post(
            f"{API_BASE_URL}/download",
            json={
                "url": url,
                "quality": "best",
                "format": "mp4"
            },
            timeout=120.0  # Longer timeout for downloads
        )
        
        data = response.json()
        
        if data["success"]:
            filename = data["data"]["filename"]
            size_mb = data["data"]["size_mb"]
            print(f"✅ Downloaded: {filename} ({size_mb} MB)")
            
            # Retrieve file
            file_response = await client.get(
                f"{API_BASE_URL}/file/{filename}",
                timeout=60.0
            )
            
            # Save locally
            with open(f"downloads/{filename}", "wb") as f:
                f.write(file_response.content)
            
            print(f"💾 Saved to: downloads/{filename}")
            
            # Clean up from server
            await client.delete(f"{API_BASE_URL}/file/{filename}")
        else:
            print(f"❌ Error: {data['message']}")

# ============================================================================
# EXAMPLE 3: Batch Download
# ============================================================================

async def batch_download():
    """Download multiple videos concurrently"""
    
    urls = [
        "https://www.instagram.com/reel/ABC123/",
        "https://www.tiktok.com/@user/video/456",
        "https://twitter.com/user/status/789",
        "https://www.youtube.com/watch?v=XYZ",
    ]
    
    async with httpx.AsyncClient() as client:
        # Create tasks
        tasks = []
        for url in urls:
            task = client.post(
                f"{API_BASE_URL}/download",
                json={"url": url, "quality": "medium"},
                timeout=120.0
            )
            tasks.append(task)
        
        # Execute concurrently (limit to 3 at a time)
        semaphore = asyncio.Semaphore(3)
        
        async def limited_download(task):
            async with semaphore:
                return await task
        
        results = await asyncio.gather(*[limited_download(task) for task in tasks], return_exceptions=True)
        
        # Process results
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"❌ Video {i+1} failed: {result}")
                continue
            
            data = result.json()
            if data["success"]:
                print(f"✅ Video {i+1}: {data['data']['filename']}")
            else:
                print(f"❌ Video {i+1}: {data['message']}")

# ============================================================================
# EXAMPLE 4: Error Handling
# ============================================================================

async def download_with_error_handling():
    """Robust download with proper error handling"""
    
    test_urls = [
        "https://www.instagram.com/reel/VALID_ID/",  # Should work
        "https://www.instagram.com/reel/DELETED/",   # Will fail - deleted
        "https://www.instagram.com/private/VIDEO/",  # Will fail - private
    ]
    
    async with httpx.AsyncClient() as client:
        for url in test_urls:
            print(f"\n📥 Downloading: {url}")
            
            try:
                response = await client.post(
                    f"{API_BASE_URL}/download",
                    json={"url": url, "quality": "best"},
                    timeout=60.0
                )
                
                data = response.json()
                
                if data["success"]:
                    print(f"✅ Success: {data['data']['filename']}")
                else:
                    error_type = data.get('error', 'Unknown')
                    message = data.get('message', 'Unknown error')
                    
                    if error_type == 'PrivateAccountError':
                        print(f"🔒 Private account: {message}")
                    elif error_type == 'VideoDeletedError':
                        print(f"🗑️ Video deleted: {message}")
                    elif error_type == 'GeoBlockedError':
                        print(f"🌍 Geo-blocked: {message}")
                    elif error_type == 'LoginRequiredError':
                        print(f"🔑 Login required: {message}")
                    elif error_type == 'RateLimitError':
                        print(f"⏱️ Rate limited: {message}")
                    else:
                        print(f"❌ Error ({error_type}): {message}")
                        
            except httpx.TimeoutException:
                print("⏰ Request timed out")
            except httpx.RequestError as e:
                print(f"❌ Request failed: {e}")

# ============================================================================
# EXAMPLE 5: Quality Selection
# ============================================================================

async def download_different_qualities():
    """Download same video in different qualities"""
    
    url = "https://www.youtube.com/watch?v=TEST"
    qualities = ["best", "high", "medium", "low"]
    
    async with httpx.AsyncClient() as client:
        for quality in qualities:
            print(f"\n📹 Downloading {quality} quality...")
            
            response = await client.post(
                f"{API_BASE_URL}/download",
                json={"url": url, "quality": quality},
                timeout=120.0
            )
            
            data = response.json()
            
            if data["success"]:
                size_mb = data["data"]["size_mb"]
                filename = data["data"]["filename"]
                print(f"✅ {quality}: {filename} ({size_mb} MB)")
            else:
                print(f"❌ {quality} failed: {data['message']}")

# ============================================================================
# EXAMPLE 6: Check Server Health
# ============================================================================

async def check_health():
    """Check API server status"""
    
    async with httpx.AsyncClient() as client:
        # Basic health
        response = await client.get(f"{API_BASE_URL}/health")
        data = response.json()
        
        if data["success"]:
            health = data["data"]
            print("✅ Server Health:")
            print(f"   Status: {health['status']}")
            print(f"   Cookies: {'Available' if health['cookies_available'] else 'Not Found'}")
            print(f"   Disk: {health['disk_usage']['free_gb']} GB free")
        else:
            print("❌ Server unhealthy")

# ============================================================================
# EXAMPLE 7: Get Supported Platforms
# ============================================================================

async def list_platforms():
    """List all supported platforms"""
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/platforms")
        data = response.json()
        
        if data["success"]:
            platforms = data["data"]["platforms"]
            print(f"📱 Supported Platforms ({data['data']['count']}):")
            
            for domain, name in platforms.items():
                print(f"   • {name}: {domain}")

# ============================================================================
# EXAMPLE 8: Frontend Integration (React/Vue)
# ============================================================================

"""
// React Example
async function downloadVideo(url) {
  try {
    const response = await fetch('http://localhost:8000/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, quality: 'best', format: 'mp4' }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Download complete
      const filename = data.data.filename;
      
      // Get the file
      const fileResponse = await fetch(`http://localhost:8000/file/${filename}`);
      const blob = await fileResponse.blob();
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.click();
      
      // Cleanup
      URL.revokeObjectURL(downloadUrl);
      
      // Delete from server
      await fetch(`http://localhost:8000/file/${filename}`, { method: 'DELETE' });
    } else {
      // Show error
      alert(data.message);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
}
"""

# ============================================================================
# RUN EXAMPLES
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Social Media Downloader API - Examples")
    print("=" * 60)
    
    # Select example to run
    # asyncio.run(extract_video_info())
    # asyncio.run(download_video())
    # asyncio.run(batch_download())
    # asyncio.run(download_with_error_handling())
    # asyncio.run(download_different_qualities())
    # asyncio.run(check_health())
    # asyncio.run(list_platforms())
    
    print("\n💡 Uncomment an example to run it")
