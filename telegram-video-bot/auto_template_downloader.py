"""
Simple Instagram/YouTube Auto-Downloader
Link orqali video yuklab, avtomatik templatesga qo'shadi
"""

import os
import sys
import json
import requests
import yt_dlp
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================

UPLOAD_SERVER = "http://localhost:3001"
UPLOAD_PASSWORD = "creative2026"

OUTPUT_DIR = Path(__file__).parent.parent / "public"
VIDEOS_DIR = OUTPUT_DIR / "videos"
IMAGES_DIR = OUTPUT_DIR / "image"
DATA_FILE = OUTPUT_DIR / "data" / "videos.json"

VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

# ============================================================================
# AUTO DOWNLOADER CLASS
# ============================================================================

class AutoTemplateDownloader:
    """Instagram/YouTube dan video yuklab, templatesga qo'shadi"""
    
    def __init__(self):
        self.session = requests.Session()
        
    def download_from_url(self, url: str) -> dict:
        """Instagram Reels yoki YouTube dan video yuklash"""
        print(f"\n[INFO] Yuklanmoqda: {url}")
        
        try:
            # Get video info with yt-dlp
            ydl_opts = {
                'format': 'best[ext=mp4]/best',
                'quiet': True,
                'no_warnings': True,
                'noplaylist': True,
                'extract_flat': False,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    return {"success": False, "error": "Video topilmadi"}
                
                title = info.get('title', 'Unknown')
                thumbnail = info.get('thumbnail', '')
                video_url = info.get('url', url)
                
                print(f"✓ Topildi: {title}")
                print(f"  Thumbnail: {thumbnail}")
            
            # Download video
            video_path = self._download_video(video_url, title)
            print(f"✓ Video yuklandi: {video_path}")
            
            # Download thumbnail
            thumbnail_path = None
            if thumbnail:
                thumbnail_path = self._download_thumbnail(thumbnail, title)
                print(f"✓ Thumbnail yuklandi: {thumbnail_path}")
            
            # Add to templates
            result = self._add_to_templates(
                title=title,
                video_path=video_path,
                image_path=thumbnail_path
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _download_video(self, url: str, title: str) -> str:
        """Video yuklash"""
        safe_title = self._sanitize_filename(title)
        filename = f"v_{safe_title}.mp4"
        filepath = VIDEOS_DIR / filename
        
        # Download with requests
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return str(filepath)
    
    def _download_thumbnail(self, url: str, title: str) -> str:
        """Thumbnail yuklash"""
        safe_title = self._sanitize_filename(title)
        filename = f"i_{safe_title}.jpg"
        filepath = IMAGES_DIR / filename
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        return str(filepath)
    
    def _add_to_templates(self, title: str, video_path: str, image_path: str = None) -> dict:
        """Videoni templatesga qo'shish"""
        video_filename = Path(video_path).name
        image_filename = Path(image_path).name if image_path else None
        
        video_url = f"/videos/{video_filename}"
        image_url = f"/image/{image_filename}" if image_filename else "/image/default.jpg"
        
        upload_url = f"{UPLOAD_SERVER}/api/upload"
        
        files = {}
        data = {
            'title': title,
            'password': UPLOAD_PASSWORD
        }
        
        files['video'] = open(video_path, 'rb')
        
        if image_path and os.path.exists(image_path):
            files['image'] = open(image_path, 'rb')
        
        try:
            response = self.session.post(upload_url, files=files, data=data)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('success'):
                print(f"✅ Templatesga qo'shildi!")
                print(f"  ID: {result.get('data', {}).get('id')}")
                print(f"  Title: {result.get('data', {}).get('title')}")
                return {"success": True, "data": result}
            else:
                return {"success": False, "error": result.get('error', 'Unknown error')}
                
        except Exception as e:
            return {"success": False, "error": f"Upload error: {str(e)}"}
        finally:
            for f in files.values():
                f.close()
    
    def _sanitize_filename(self, filename: str) -> str:
        """Fayl nomini tozalash"""
        import time
        sanitized = filename
        for char in ['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>', '.']:
            sanitized = sanitized.replace(char, '-')
        return f"{int(time.time())}_{sanitized[:30]}"

# ============================================================================
# QUICK FUNCTIONS
# ============================================================================

def download_reel(url: str) -> dict:
    """Instagram Reels dan video yuklash"""
    downloader = AutoTemplateDownloader()
    return downloader.download_from_url(url)

def download_youtube(url: str) -> dict:
    """YouTube dan video yuklash"""
    downloader = AutoTemplateDownloader()
    return downloader.download_from_url(url)

# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  CREATIVE DESIGN - AUTO TEMPLATE DOWNLOADER")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        url = sys.argv[1]
        
        print(f"[INFO] URL: {url}")
        
        if 'instagram' in url.lower():
            result = download_reel(url)
        elif 'youtube' in url.lower() or 'youtu.be' in url.lower():
            result = download_youtube(url)
        else:
            result = download_reel(url)
        
        if result.get('success'):
            print("\n[SUCCESS] Video templatesga qo'shildi")
            print(f"   URL: http://localhost:5173/templates")
        else:
            print(f"\n[ERROR] XATOLIK: {result.get('error')}")
    else:
        print("Instagram Reels yoki YouTube linkini kiriting:")
        print("(yoki 'exit' deb yozing chiqish uchun)")
        print()
        
        while True:
            try:
                url = input("> ").strip()
                
                if url.lower() == 'exit':
                    break
                
                if not url:
                    continue
                
                if 'instagram' in url.lower():
                    result = download_reel(url)
                elif 'youtube' in url.lower() or 'youtu.be' in url.lower():
                    result = download_youtube(url)
                else:
                    result = download_reel(url)
                
                if result.get('success'):
                    print("\n[SUCCESS] Video templatesga qo'shildi")
                    print(f"   URL: http://localhost:5173/templates")
                else:
                    print(f"\n[ERROR] XATOLIK: {result.get('error')}")
                
                print("\n" + "=" * 60)
                print("Keyingi linkni kiriting (yoki 'exit'):")
                
            except KeyboardInterrupt:
                print("\n\nTo'xtatildi")
                break
            except Exception as e:
                print(f"\n[ERROR] Xatolik: {e}")
