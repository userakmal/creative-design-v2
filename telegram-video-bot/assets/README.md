# Assets Directory

This directory contains media assets for the Telegram Video Downloader Bot.

## Required Files

### `downloading.gif`
A Lottie animation converted to GIF format showing a professional downloading/loader animation.

**Recommended specifications:**
- Size: 200x200 pixels (or similar square aspect ratio)
- Duration: 2-3 seconds loop
- File size: < 1MB (Telegram limit for animations)
- Format: GIF with transparency support

**How to create:**
1. Create a Lottie animation in After Effects or similar tool
2. Export as JSON using Bodymovin
3. Convert to GIF using:
   - Online: https://lottiefiles.com/converter
   - CLI: `lottie-gif-converter animation.json -o downloading.gif`
   - Python: Use `lottie2gif` library

**Placeholder:**
If `downloading.gif` is not present, the bot will still work but won't show the animation.

## Optional Files

### `error.gif`
Animation for error states (future enhancement).

### `success.gif`
Animation for successful download completion (future enhancement).
