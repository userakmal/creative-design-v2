#!/usr/bin/env python3
"""
INSTAGRAM VIDEO DOWNLOADER
Downloads video and extracts thumbnail from Instagram URL
Usage: python instagram-downloader.py <instagram_url> <output_dir>
"""

import sys
import os
import json
import yt_dlp
from pathlib import Path

def download_instagram_video(url: str, output_dir: str) -> dict:
    """
    Download Instagram video and extract thumbnail
    Returns: {
        "success": bool,
        "video_path": str,
        "thumbnail_path": str,
        "title": str,
        "duration": str,
        "error": str (optional)
    }
    """
    try:
        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Configure yt-dlp options
        ydl_opts = {
            'outtmpl': os.path.join(output_dir, '%(title).50s.%(ext)s'),
            'format': 'best[ext=mp4]/best',
            'writethumbnail': True,
            'thumbnail_format': 'jpg',
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }
        
        print(f"📥 Downloading from Instagram: {url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info first
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return {
                    "success": False,
                    "error": "Video ma'lumotlarini olib bo'lmadi"
                }
            
            # Generate clean filename
            video_title = info.get('title', 'Instagram Video')
            clean_title = "".join(c if c.isalnum() else '_' for c in video_title)[:50]
            
            # Update output template with clean name
            ydl_opts['outtmpl'] = os.path.join(output_dir, f'{clean_title}.%(ext)s')
            
            # Download video
            with yt_dlp.YoutubeDL(ydl_opts) as ydl2:
                ydl2.download([url])
            
            # Find downloaded files
            video_path = None
            thumbnail_path = None
            
            for file in os.listdir(output_dir):
                if file.startswith(clean_title):
                    if file.endswith(('.mp4', '.mkv', '.webm')):
                        video_path = os.path.join(output_dir, file)
                    elif file.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                        thumbnail_path = os.path.join(output_dir, file)
            
            if not video_path:
                return {
                    "success": False,
                    "error": "Video fayl topilmadi"
                }
            
            # Get video duration
            duration = info.get('duration', 0)
            duration_str = f"{duration // 60}:{duration % 60:02d}" if duration else "0:00"
            
            result = {
                "success": True,
                "video_path": video_path,
                "thumbnail_path": thumbnail_path,
                "title": video_title,
                "duration": duration_str,
                "size_mb": round(os.path.getsize(video_path) / (1024 * 1024), 2)
            }
            
            print(f"✅ Downloaded successfully!")
            print(f"   Title: {video_title}")
            print(f"   Video: {video_path}")
            print(f"   Thumbnail: {thumbnail_path or 'Not extracted'}")
            print(f"   Duration: {duration_str}")
            print(f"   Size: {result['size_mb']} MB")
            
            return result
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python instagram-downloader.py <instagram_url> <output_dir>")
        sys.exit(1)
    
    url = sys.argv[1]
    output_dir = sys.argv[2]
    
    result = download_instagram_video(url, output_dir)
    print(json.dumps(result, indent=2))
