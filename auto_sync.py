"""
Auto Sync - Localhost to Production
Automatically sync uploaded videos to production server
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

CONFIG_FILE = Path(__file__).parent / "sync-config.json"
LOG_FILE = Path(__file__).parent / "logs" / "auto-sync.log"

# Default config
DEFAULT_CONFIG = {
    "server": {
        "host": "creative-design.uz",
        "user": "root",
        "port": 22,
        "path": "/var/www/creative-design"
    },
    "sync": {
        "enabled": True,
        "interval": 60,  # seconds
        "auto": True
    },
    "paths": {
        "videos": "public/videos/",
        "images": "public/image/",
        "data": "public/data/videos.json"
    }
}

# ============================================================================
# LOGGING
# ============================================================================

def log(message: str, level: str = "INFO"):
    """Log message to file and console"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"[{timestamp}] [{level}] {message}"
    
    # Console
    print(log_message)
    
    # File
    try:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_message + '\n')
    except Exception as e:
        print(f"  ⚠️  Could not write to log file: {e}")

# ============================================================================
# SYNC FUNCTIONS
# ============================================================================

def load_config() -> dict:
    """Load configuration from JSON file"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                log("Config loaded successfully")
                return config
        except Exception as e:
            log(f"Error loading config: {e}", "ERROR")
    
    log("Using default config", "WARNING")
    return DEFAULT_CONFIG

def check_rsync() -> bool:
    """Check if rsync is available"""
    try:
        result = subprocess.run(
            ['rsync', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False

def sync_directory(local_path: str, remote_path: str, config: dict) -> bool:
    """Sync directory using rsync"""
    server = config['server']
    
    cmd = [
        'rsync',
        '-avz',
        '--delete',
        '-e', f'ssh -p {server["port"]}',
        local_path,
        f"{server['user']}@{server['host']}:{remote_path}"
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            return True
        else:
            log(f"rsync error: {result.stderr}", "ERROR")
            return False
            
    except subprocess.TimeoutExpired:
        log("rsync timeout", "ERROR")
        return False
    except Exception as e:
        log(f"rsync failed: {e}", "ERROR")
        return False

def sync_videos(config: dict) -> bool:
    """Sync videos directory"""
    local = config['paths']['videos']
    remote = f"{config['server']['path']}/{config['paths']['videos']}"
    return sync_directory(local, remote, config)

def sync_images(config: dict) -> bool:
    """Sync images directory"""
    local = config['paths']['images']
    remote = f"{config['server']['path']}/{config['paths']['images']}"
    return sync_directory(local, remote, config)

def sync_videos_json(config: dict) -> bool:
    """Sync videos.json file"""
    local = config['paths']['data']
    remote_dir = f"{config['server']['path']}/public/data"
    
    server = config['server']
    cmd = [
        'rsync',
        '-avz',
        '-e', f'ssh -p {server["port"]}',
        local,
        f"{server['user']}@{server['host']}:{remote_dir}"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return result.returncode == 0
    except Exception as e:
        log(f"videos.json sync failed: {e}", "ERROR")
        return False

# ============================================================================
# MAIN LOOP
# ============================================================================

def main():
    """Main auto-sync loop"""
    print("=" * 60)
    print("  🔄 AUTO SYNC - LOCALHOST TO PRODUCTION")
    print("  creative-design.uz")
    print("=" * 60)
    print()
    
    # Load config
    config = load_config()
    
    # Check rsync
    if not check_rsync():
        log("rsync not found! Please install Git Bash or rsync", "ERROR")
        print()
        print("Install from: https://git-scm.com/download/win")
        input("\nPress Enter to exit...")
        return
    
    log("✓ rsync available")
    log("✓ Auto-sync started")
    
    server = config['server']
    interval = config['sync']['interval']
    
    log(f"Server: {server['user']}@{server['host']}")
    log(f"Interval: {interval} seconds")
    print()
    print("To stop: Ctrl+C")
    print()
    print("=" * 60)
    
    try:
        while True:
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # Sync videos
            log(f"[{timestamp}] Syncing videos...")
            if sync_videos(config):
                log("  ✅ Videos synced")
            else:
                log("  ⚠️  Videos sync failed (server offline?)", "WARNING")
            
            # Sync images
            log(f"[{timestamp}] Syncing images...")
            if sync_images(config):
                log("  ✅ Images synced")
            else:
                log("  ⚠️  Images sync failed", "WARNING")
            
            # Sync videos.json
            log(f"[{timestamp}] Syncing videos.json...")
            if sync_videos_json(config):
                log("  ✅ videos.json synced")
            else:
                log("  ⚠️  videos.json sync failed", "WARNING")
            
            print()
            log(f"Next sync in {interval} seconds...")
            print()
            
            # Wait
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print()
        log("Auto-sync stopped by user")
        print()
        print("Goodbye!")

if __name__ == "__main__":
    main()
