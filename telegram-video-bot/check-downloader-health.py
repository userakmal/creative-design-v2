#!/usr/bin/env python3
"""
DOWNLOADER HEALTH CHECK
Quick diagnostic tool to verify all downloader components are working.
"""

import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime

def check_python():
    """Check Python version."""
    print("\n🐍 Python Environment:")
    print(f"   Version: {sys.version}")
    print(f"   Executable: {sys.executable}")

def check_package(name, import_name=None):
    """Check if a Python package is installed."""
    import_name = import_name or name
    try:
        mod = __import__(import_name)
        version = getattr(mod, '__version__', 'unknown')
        print(f"   ✅ {name}: {version}")
        return True
    except ImportError:
        print(f"   ❌ {name}: NOT INSTALLED")
        return False

def check_ffmpeg():
    """Check FFmpeg availability."""
    print("\n🎬 FFmpeg Status:")
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version = result.stdout.split()[2] if result.stdout.split() else 'unknown'
            print(f"   ✅ FFmpeg: {version}")
            return True
    except Exception as e:
        print(f"   ❌ FFmpeg: NOT FOUND ({str(e)})")
        return False

def check_downloader_files():
    """Check if all downloader files exist."""
    print("\n📁 Downloader Files:")
    base = Path(__file__).parent.parent
    
    files = {
        'Frontend Downloader': 'pages/downloader.page.tsx',
        'Core Downloader Engine': 'telegram-video-bot/downloader.py',
        'Video API Server': 'telegram-video-bot/api.py',
        'Instagram Downloader': 'instagram-downloader.py',
        'Upload Server': 'upload-server.js',
        'Config': 'telegram-video-bot/config.py',
        'Requirements': 'telegram-video-bot/requirements.txt',
    }
    
    all_ok = True
    for name, filepath in files.items():
        full_path = base / filepath
        if full_path.exists():
            size = full_path.stat().st_size
            print(f"   ✅ {name}: {filepath} ({size:,} bytes)")
        else:
            print(f"   ❌ {name}: {filepath} (MISSING)")
            all_ok = False
    
    return all_ok

def check_cookies():
    """Check YouTube cookies file."""
    print("\n🍪 YouTube Cookies:")
    cookie_path = Path(__file__).parent / 'cookies.txt'
    if cookie_path.exists():
        size = cookie_path.stat().st_size
        if size > 100:
            print(f"   ✅ cookies.txt: {size:,} bytes")
            return True
        else:
            print(f"   ⚠️  cookies.txt: {size:,} bytes (too small, may not work)")
            return False
    else:
        print(f"   ⚠️  cookies.txt: NOT FOUND (optional but recommended)")
        return False

def check_directories():
    """Check download directories."""
    print("\n📂 Download Directories:")
    base = Path(__file__).parent.parent
    
    dirs = {
        'Instagram Downloads': 'downloads/instagram',
        'Telegram Downloads': 'telegram-video-bot/downloads',
        'Audio Extraction': 'telegram-video-bot/downloads/audio',
    }
    
    all_ok = True
    for name, dirpath in dirs.items():
        full_path = base / dirpath
        if full_path.exists():
            print(f"   ✅ {name}: {dirpath}")
        else:
            print(f"   ❌ {name}: {dirpath} (MISSING)")
            all_ok = False
    
    return all_ok

def test_api_endpoint(url, name):
    """Test an API endpoint."""
    try:
        import urllib.request
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            print(f"   ✅ {name}: {response.status} - {data.get('status', 'OK')}")
            return True
    except Exception as e:
        print(f"   ❌ {name}: FAILED ({str(e)})")
        return False

def test_services():
    """Test running services."""
    print("\n🌐 Running Services:")
    
    services = {
        'http://localhost:8000/api/health': 'Video API (8000)',
        'http://localhost:3001/api/health': 'Upload Server (3001)',
        'http://localhost:5173': 'Web App (5173)',
    }
    
    results = {}
    for url, name in services.items():
        results[name] = test_api_endpoint(url, name)
    
    return results

def main():
    print("=" * 70)
    print("  CREATIVE DESIGN - DOWNLOADER HEALTH CHECK")
    print("=" * 70)
    print(f"\n⏰ Check Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Python environment
    check_python()
    
    # Python packages
    print("\n📦 Python Packages:")
    packages = {
        'yt-dlp': 'yt_dlp',
        'FastAPI': 'fastapi',
        'uvicorn': 'uvicorn',
        'loguru': 'loguru',
        'aiohttp': 'aiohttp',
        'requests': 'requests',
    }
    
    pkg_results = {name: check_package(name, import_name) 
                   for name, import_name in packages.items()}
    
    # FFmpeg
    ffmpeg_ok = check_ffmpeg()
    
    # Files
    files_ok = check_downloader_files()
    
    # Cookies
    cookies_ok = check_cookies()
    
    # Directories
    dirs_ok = check_directories()
    
    # Services
    services_results = test_services()
    
    # Summary
    print("\n" + "=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    
    issues = []
    if not all(pkg_results.values()):
        missing = [name for name, ok in pkg_results.items() if not ok]
        issues.append(f"Missing packages: {', '.join(missing)}")
    
    if not ffmpeg_ok:
        issues.append("FFmpeg not installed (required for video merge)")
    
    if not files_ok:
        issues.append("Some downloader files are missing")
    
    if not services_results.get('Video API (8000)'):
        issues.append("Video API server is not running")
    
    if not services_results.get('Upload Server (3001)'):
        issues.append("Upload server is not running")
    
    if issues:
        print(f"\n⚠️  ISSUES FOUND ({len(issues)}):")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
        print("\n💡 Run fix-downloaders.bat to resolve these issues")
    else:
        print("\n✅ ALL DOWNLOADER COMPONENTS HEALTHY!")
        print("   All systems operational - ready to download videos")
    
    print("\n" + "=" * 70)
    
    return 0 if not issues else 1

if __name__ == '__main__':
    sys.exit(main())
