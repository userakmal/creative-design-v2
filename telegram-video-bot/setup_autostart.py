"""
Telegram Video Downloader Bot - AutoStart Setup Script
Sets up automatic bot startup on Windows login.
"""

import os
import sys
import winreg
from pathlib import Path


def get_bot_directory():
    """Get the bot directory path."""
    return Path(__file__).parent.absolute()


def create_startup_shortcut():
    """Create a shortcut in Windows Startup folder."""
    try:
        import pythoncom
        from win32com.client import Dispatch
    except ImportError:
        print("⚠️ pywin32 not installed - skipping shortcut creation")
        print("   Install with: pip install pywin32")
        print("   (Registry autostart will still work)")
        return False
    
    bot_dir = get_bot_directory()
    bot_script = bot_dir / "bot.py"
    python_exe = sys.executable
    
    # Windows Startup folder
    startup_folder = Path(os.getenv("APPDATA")) / r"Microsoft\Windows\Start Menu\Programs\Startup"
    
    # Create shortcut
    shortcut_path = startup_folder / "TelegramVideoBot.lnk"
    
    try:
        shell = Dispatch('WScript.Shell')
        shortcut = shell.CreateShortCut(str(shortcut_path))
        shortcut.TargetPath = python_exe
        shortcut.Arguments = str(bot_script)
        shortcut.WorkingDirectory = str(bot_dir)
        shortcut.IconLocation = "python.exe,0"
        shortcut.Description = "Telegram Video Downloader Bot"
        shortcut.save()
        
        print(f"✅ Startup shortcut created: {shortcut_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create shortcut: {e}")
        return False


def add_to_registry():
    """Add bot to Windows Registry Run key."""
    bot_dir = get_bot_directory()
    bot_script = bot_dir / "bot.py"
    python_exe = sys.executable
    
    # Command to run
    command = f'"{python_exe}" "{bot_script}"'
    
    try:
        # Open Registry key for current user
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0,
            winreg.KEY_SET_VALUE
        )
        
        # Set the value
        winreg.SetValueEx(key, "TelegramVideoBot", 0, winreg.REG_SZ, command)
        winreg.CloseKey(key)
        
        print(f"✅ Registry entry added: HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\TelegramVideoBot")
        return True
    except Exception as e:
        print(f"❌ Failed to add registry entry: {e}")
        return False


def create_batch_starter():
    """Create a batch file to start the bot."""
    bot_dir = get_bot_directory()
    batch_path = bot_dir / "start_bot.bat"
    
    batch_content = f'''@echo off
REM Telegram Video Downloader Bot - Starter Script
REM This script starts the bot with proper environment

TITLE Telegram Video Downloader Bot

cd /d "{bot_dir}"

echo ============================================
echo  Telegram Video Downloader Bot
echo  Starting...
echo ============================================
echo.

REM Check if cookies.txt exists
if not exist "cookies.txt" (
    echo WARNING: cookies.txt not found!
    echo YouTube downloads may fail.
    echo Please export cookies from browser and place cookies.txt in:
    echo {bot_dir}
    echo.
    pause
)

REM Start the bot
python bot.py

pause
'''
    
    try:
        with open(batch_path, "w", encoding="utf-8") as f:
            f.write(batch_content)
        
        print(f"✅ Batch starter created: {batch_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create batch file: {e}")
        return False


def create_task_scheduler_xml():
    """Create Task Scheduler XML for advanced autostart."""
    bot_dir = get_bot_directory()
    bot_script = bot_dir / "bot.py"
    python_exe = sys.executable
    
    xml_content = f'''<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Telegram Video Downloader Bot - AutoStart</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <Delay>PT30S</Delay>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>"{python_exe}"</Command>
      <Arguments>"{bot_script}"</Arguments>
      <WorkingDirectory>{bot_dir}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
'''
    
    xml_path = bot_dir / "TelegramVideoBot_Task.xml"
    
    try:
        with open(xml_path, "w", encoding="utf-8") as f:
            f.write(xml_content)
        
        print(f"✅ Task Scheduler XML created: {xml_path}")
        print(f"   To import: Open Task Scheduler → Import Task → Select {xml_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create XML: {e}")
        return False


def verify_cookies():
    """Verify cookies.txt exists and is valid."""
    bot_dir = get_bot_directory()
    cookie_file = bot_dir / "cookies.txt"
    
    if cookie_file.exists():
        size = cookie_file.stat().st_size
        if size > 100:
            print(f"✅ cookies.txt found ({size} bytes)")
            return True
        else:
            print(f"⚠️ cookies.txt exists but is too small ({size} bytes)")
            return False
    else:
        print(f"❌ cookies.txt NOT FOUND!")
        print(f"   Please export YouTube cookies and place at: {cookie_file}")
        return False


def main():
    """Main setup function."""
    print("=" * 60)
    print("  Telegram Video Downloader Bot - AutoStart Setup")
    print("=" * 60)
    print()
    
    bot_dir = get_bot_directory()
    print(f"Bot directory: {bot_dir}")
    print()
    
    # Verify cookies
    print("Checking cookies.txt...")
    cookies_ok = verify_cookies()
    print()
    
    # Create batch starter
    print("Creating batch starter...")
    create_batch_starter()
    print()
    
    # Add to registry (most reliable for autostart)
    print("Setting up Windows Registry autostart...")
    registry_ok = add_to_registry()
    print()
    
    # Create startup shortcut
    print("Creating Startup folder shortcut...")
    shortcut_ok = create_startup_shortcut()
    print()
    
    # Create Task Scheduler XML
    print("Creating Task Scheduler XML (optional advanced method)...")
    xml_ok = create_task_scheduler_xml()
    print()
    
    # Summary
    print("=" * 60)
    print("  Setup Complete!")
    print("=" * 60)
    print()
    
    if registry_ok or shortcut_ok:
        print("✅ Autostart is configured!")
        print("   The bot will start automatically when you log in to Windows.")
    else:
        print("⚠️ Autostart setup had issues.")
        print("   You can manually run: start_bot.bat")
    
    if not cookies_ok:
        print()
        print("⚠️ WARNING: cookies.txt is missing or invalid!")
        print("   YouTube downloads will fail until you add valid cookies.")
        print("   See: https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp")
    
    print()
    print("To start the bot manually:")
    print(f"  cd {bot_dir}")
    print("  python bot.py")
    print()
    print("Or run:")
    print(f"  {bot_dir}\\start_bot.bat")
    print()
    
    input("Press Enter to exit...")


if __name__ == "__main__":
    main()
