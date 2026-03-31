"""
Instagram Reels & YouTube Auto-Downloader
Link orqali video yuklab, avtomatik templatesga qo'shadi
"""

import os
import sys
import json
import requests
from pathlib import Path
from downloader import VideoDownloader, VideoInfo
from config import config

# ============================================================================
# CONFIGURATION
# ============================================================================

# Creative Design upload server
UPLOAD_SERVER = "http://localhost:3001"
UPLOAD_PASSWORD = "creative2026"

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "public"
VIDEOS_DIR = OUTPUT_DIR / "videos"
IMAGES_DIR = OUTPUT_DIR / "image"
DATA_FILE = OUTPUT_DIR / "data" / "videos.json"

# Ensure directories exist
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

# ============================================================================
# AUTO DOWNLOADER CLASS
# ============================================================================

class AutoTemplateDownloader:
    """Instagram/YouTube dan video yuklab, templatesga qo'shadi"""
    
    def __init__(self):
        self.downloader = VideoDownloader()
        self.session = requests.Session()
        
    def download_from_url(self, url: str) -> dict:
        """
        Instagram Reels yoki YouTube dan video yuklash
        """
        print(f"\n📥 Yuklanmoqda: {url}")
        
        try:
            # Video ma'lumotlarini olish
            video_info = self.downloader.get_video_info(url)
            
            if not video_info:
                return {"success": False, "error": "Video topilmadi"}
            
            print(f"✓ Topildi: {video_info.title}")
            print(f"  Duration: {video_info.duration}")
            print(f"  Thumbnail: {video_info.thumbnail}")
            
            # Video yuklash
            video_path = self.downloader.download_video(url, output_dir=VIDEOS_DIR)
            
            if not video_path:
                return {"success": False, "error": "Video yuklashda xatolik"}
            
            print(f"✓ Video yuklandi: {video_path}")
            
            # Thumbnail yuklash
            thumbnail_path = None
            if video_info.thumbnail and video_info.thumbnail.startswith('http'):
                thumbnail_path = self.download_thumbnail(
                    video_info.thumbnail, 
                    video_info.title,
                    IMAGES_DIR
                )
                print(f"✓ Thumbnail yuklandi: {thumbnail_path}")
            
            # Templatesga qo'shish
            result = self.add_to_templates(
                title=video_info.title,
                video_path=video_path,
                image_path=thumbnail_path
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def download_thumbnail(self, url: str, title: str, output_dir: Path) -> str:
        """Thumbnail ni yuklash"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Filename yaratish
            safe_title = self.sanitize_filename(title)
            filename = f"i_{safe_title}.jpg"
            filepath = output_dir / filename
            
            # Save
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return str(filepath)
            
        except Exception as e:
            print(f"⚠️ Thumbnail yuklashda xatolik: {e}")
            return None
    
    def add_to_templates(self, title: str, video_path: str, image_path: str = None) -> dict:
        """
        Videoni templatesga qo'shish
        Upload server API orqali
        """
        # Fayl nomlarini tayyorlash
        video_filename = Path(video_path).name
        image_filename = Path(image_path).name if image_path else None
        
        # URL lar
        video_url = f"/videos/{video_filename}"
        image_url = f"/image/{image_filename}" if image_filename else "/image/default.jpg"
        
        # Upload serverga yuborish
        upload_url = f"{UPLOAD_SERVER}/api/upload"
        
        files = {}
        data = {
            'title': title,
            'password': UPLOAD_PASSWORD
        }
        
        # Video fayl
        files['video'] = open(video_path, 'rb')
        
        # Image fayl
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
            # Close files
            for f in files.values():
                f.close()
    
    def sanitize_filename(self, filename: str) -> str:
        """Fayl nomini tozalash"""
        # Maxsus belgilarni olib tashlash
        sanitized = filename
        for char in ['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>', '.']:
            sanitized = sanitized.replace(char, '-')
        return sanitized[:50]  # 50 belgigacha
    
    def add_from_json(self, json_file: str):
        """
        JSON fayldan linklarni o'qib, avtomatik yuklash
        """
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        urls = data.get('urls', [])
        
        print(f"📋 {len(urls)} ta link topildi")
        
        results = []
        for i, url in enumerate(urls, 1):
            print(f"\n[{i}/{len(urls)}] {url}")
            result = self.download_from_url(url)
            results.append(result)
            
            # 2 soniya kutish (rate limit)
            if i < len(urls):
                import time
                time.sleep(2)
        
        # Natija
        success_count = sum(1 for r in results if r.get('success'))
        print(f"\n✅ Tayyor! {success_count}/{len(urls)} ta video yuklandi")
        
        return results

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

def download_batch(json_file: str) -> list:
    """JSON fayldan bir nechta video yuklash"""
    downloader = AutoTemplateDownloader()
    return downloader.add_from_json(json_file)

# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  CREATIVE DESIGN - AUTO TEMPLATE DOWNLOADER")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        # Command line argument
        url = sys.argv[1]
        
        if url.endswith('.json'):
            # JSON batch mode
            print(f"📋 JSON mode: {url}")
            results = download_batch(url)
        else:
            # Single URL mode
            print(f"📥 URL: {url}")
            result = download_reel(url) if 'instagram' in url else download_youtube(url)
            
            if result.get('success'):
                print("\n✅ MUVAFFAQIYAT!")
            else:
                print(f"\n❌ XATOLIK: {result.get('error')}")
    else:
        # Interactive mode
        print("Instagram Reels yoki YouTube linkini kiriting:")
        print("(yoki 'batch' deb yozing JSON fayl uchun)")
        print()
        
        while True:
            try:
                url = input("> ").strip()
                
                if url.lower() == 'exit':
                    break
                
                if url.lower() == 'batch':
                    json_file = input("JSON fayl nomi: ").strip()
                    if os.path.exists(json_file):
                        download_batch(json_file)
                    else:
                        print("❌ Fayl topilmadi!")
                    continue
                
                if not url:
                    continue
                
                # Download
                if 'instagram' in url.lower():
                    result = download_reel(url)
                elif 'youtube' in url.lower() or 'youtu.be' in url.lower():
                    result = download_youtube(url)
                else:
                    result = download_reel(url)  # Try anyway
                
                if result.get('success'):
                    print("\n✅ MUVAFFAQIYAT! Video templatesga qo'shildi")
                    print(f"   URL: http://localhost:5173/templates")
                else:
                    print(f"\n❌ XATOLIK: {result.get('error')}")
                
                print("\n" + "=" * 60)
                print("Keyingi linkni kiriting (yoki 'exit'):")
                
            except KeyboardInterrupt:
                print("\n\nTo'xtatildi")
                break
            except Exception as e:
                print(f"\n❌ Xatolik: {e}")
