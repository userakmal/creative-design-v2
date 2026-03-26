/**
 * Video Downloader API - Utility Functions
 * Senior-level utilities with proper error handling and security
 */

import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { 
  VideoDownloaderError, 
  InvalidUrlError, 
  UserAgent,
  ServerConfig,
  DEFAULT_SERVER_CONFIG 
} from './types';

export const execPromise = promisify(require('child_process').exec);

// ============================================================================
// USER AGENT ROTATION
// ============================================================================

export const USER_AGENTS: UserAgent[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
];

/**
 * Get a random user agent for request rotation
 */
export const getRotatedUserAgent = (): UserAgent => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// ============================================================================
// URL VALIDATION AND DETECTION
// ============================================================================

/**
 * Check if URL is an M3U8 stream
 */
export const isM3U8 = (url: string): boolean => {
  return /\.m3u8(\?|$)/i.test(url) || url.includes('m3u8');
};

/**
 * Check if URL is a direct video file
 */
export const isDirectVideo = (url: string): boolean => {
  return /\.(mp4|webm|mkv|avi|mov|flv)(\?|$|#)/i.test(url);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize filename to prevent path traversal and injection attacks
 */
export const sanitizeFilename = (filename: string, maxLength: number = 50): string => {
  // Remove path separators and dangerous characters
  const sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\.\./g, '')
    .replace(/[^\w\-_.]/g, '')
    .substring(0, maxLength);
  
  return sanitized || 'video';
};

/**
 * Generate a unique job ID
 */
export const generateJobId = (prefix: string = 'job'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================================
// FILE SYSTEM UTILITIES
// ============================================================================

/**
 * Safely delete a file if it exists
 */
export const safeUnlink = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[FileSystem] Failed to delete ${filePath}:`, error);
    return false;
  }
};

/**
 * Comprehensive cleanup of download artifacts
 */
export const cleanupDownloadArtifacts = (basePath: string): void => {
  const extensions = ['.part', '.ytdl', '.tmp', '.download'];
  
  safeUnlink(basePath);
  extensions.forEach(ext => safeUnlink(basePath + ext));
};

/**
 * Clean up old temporary files from directory
 */
export const cleanupOldFiles = (directory: string, maxAgeHours: number = 24): number => {
  console.log('[Cleanup] Removing old temporary files...');
  
  let count = 0;
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      if (file.endsWith('.mp4') || file.endsWith('.part') || file.endsWith('.ytdl')) {
        const filePath = path.join(directory, file);
        try {
          const stats = fs.statSync(filePath);
          
          // Delete if older than maxAge
          if (now - stats.mtimeMs > maxAge) {
            safeUnlink(filePath);
            count++;
          }
        } catch {
          // File might be in use, skip
        }
      }
    });
    
    if (count > 0) {
      console.log(`[Cleanup] Removed ${count} old file(s)`);
    }
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
  }
  
  return count;
};

/**
 * Ensure directory exists
 */
export const ensureDirectory = async (dirPath: string): Promise<void> => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

// ============================================================================
// YT-DLP UTILITIES
// ============================================================================

/**
 * Get path to yt-dlp executable
 */
export const getYtDlpPath = (): string => {
  const possiblePaths = [
    path.join(__dirname, 'yt-dlp.exe'),
    path.join(process.cwd(), 'yt-dlp.exe'),
    'yt-dlp', // Assume in PATH
  ];
  
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch {
      // Continue to next path
    }
  }
  
  // Default to yt-dlp in PATH
  return 'yt-dlp';
};

/**
 * Build yt-dlp command arguments for download
 */
export const buildYtDlpArgs = (
  url: string,
  outputPath: string,
  format: string = 'best',
  userAgent?: UserAgent
): string[] => {
  return [
    '--no-check-certificates',
    '--user-agent', userAgent || getRotatedUserAgent(),
    '--geo-bypass',
    '--prefer-insecure',
    '--legacy-server-connect',
    '--extractor-retries', '5',
    '--socket-timeout', '30',
    '--no-warnings',
    '-f', format,
    '--newline',
    '-o', outputPath,
    url,
  ];
};

/**
 * Build yt-dlp command arguments for info extraction
 */
export const buildYtDlpInfoArgs = (
  url: string,
  userAgent?: UserAgent
): string => {
  const ytcmd = getYtDlpPath();
  const ua = userAgent || getRotatedUserAgent();
  
  return `${ytcmd} --dump-json --no-check-certificates --user-agent "${ua}" "${url}"`;
};

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Format error for API response
 */
export const formatErrorResponse = (
  error: Error | unknown,
  defaultMessage: string = 'An error occurred'
): { status: 'error'; text: string } => {
  const message = error instanceof Error ? error.message : String(error);
  return {
    status: 'error' as const,
    text: message || defaultMessage,
  };
};

/**
 * Safe JSON parse with error handling
 */
export const safeJsonParse = <T>(data: string, fallback?: T): T | undefined => {
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
};

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get server configuration from environment or defaults
 */
export const getServerConfig = (): ServerConfig => {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    subdomain: process.env.TUNNEL_SUBDOMAIN || DEFAULT_SERVER_CONFIG.subdomain,
    tempDir: process.env.TEMP_DIR || __dirname,
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '300000', 10),
    downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT || '90000', 10),
    maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '10', 10),
  };
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTHOR = 'G\'ulomov Akmal';

export const SUPPORTED_PLATFORMS = [
  'YouTube',
  'TikTok', 
  'Instagram',
  'M3U8 Streams',
  'Direct Video URLs',
];

export const API_VERSION = '2.0.0';
