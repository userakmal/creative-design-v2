/**
 * Video Downloader API - Shared Type Definitions
 * Senior-level type-safe architecture
 */

// ============================================================================
// VIDEO DATA TYPES
// ============================================================================

export interface VideoData {
  title: string;
  url: string;
  thumbnail: string | null;
  type: VideoType;
  duration?: number;
  formats?: VideoFormat[];
  isM3U8?: boolean;
}

export type VideoType = 
  | 'yt-dlp'
  | 'm3u8_ytdlp'
  | 'm3u8_direct'
  | 'direct'
  | 'playwright_m3u8'
  | 'playwright_mp4'
  | 'playwright_video'
  | 'universal';

export interface VideoFormat {
  format_id: string;
  extension: string;
  resolution: string;
  filesize: number | null;
  quality: string;
  tbr?: number;
}

export interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration?: number;
  formats: VideoFormat[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  author?: string;
  type?: VideoType;
  data?: T;
  text?: string;
  message?: string;
  error?: string;
}

export interface DownloadResponse {
  title: string;
  url: string;
  thumbnail: string | null;
  isM3U8?: boolean;
}

export interface InfoResponse {
  title: string;
  thumbnail: string | null;
  duration?: number;
  formats: VideoFormat[];
}

// ============================================================================
// DOWNLOAD JOB TYPES
// ============================================================================

export interface DownloadJob {
  id: string;
  child: import('child_process').ChildProcess;
  outputPath: string;
  title: string;
  createdAt: number;
}

export type DownloadStatus = 
  | 'starting'
  | 'downloading'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface DownloadProgress {
  status: DownloadStatus;
  percent: number;
  size?: string;
  speed?: string;
  eta?: string;
  message?: string;
}

export interface ProgressEvent {
  jobId: string;
  progress: DownloadProgress;
}

// ============================================================================
// REQUEST/QUERY TYPES
// ============================================================================

export interface DownloadRequest {
  url: string;
}

export interface ProxyDownloadQuery {
  url: string;
  title?: string;
  format?: string;
  jobId?: string;
}

// ============================================================================
// PLAYWRIGHT TYPES
// ============================================================================

export interface PlaywrightVideoResult {
  url: string;
  type: string;
  priority?: number;
}

export interface FoundVideo {
  url: string;
  type: 'm3u8' | 'mp4' | 'video' | 'webm' | 'flv' | 'ts' | 'mkv' | 'avi' | 'mov';
  priority: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type UserAgent = string;

export interface YtDlpOptions {
  format?: string;
  timeout?: number;
  geoBypass?: boolean;
  extractAudio?: boolean;
}

export interface SnifferOptions {
  timeout?: number;
  clickPlay?: boolean;
  scanIframes?: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class VideoDownloaderError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'VideoDownloaderError';
  }
}

export class VideoNotFoundError extends VideoDownloaderError {
  constructor(message: string = 'Video not found') {
    super(message, 'VIDEO_NOT_FOUND', 404);
    this.name = 'VideoNotFoundError';
  }
}

export class InvalidUrlError extends VideoDownloaderError {
  constructor(message: string = 'Invalid URL') {
    super(message, 'INVALID_URL', 400);
    this.name = 'InvalidUrlError';
  }
}

export class DownloadTimeoutError extends VideoDownloaderError {
  constructor(message: string = 'Download timeout') {
    super(message, 'DOWNLOAD_TIMEOUT', 408);
    this.name = 'DownloadTimeoutError';
  }
}

export class PlaywrightError extends VideoDownloaderError {
  constructor(message: string = 'Playwright failed') {
    super(message, 'PLAYWRIGHT_ERROR', 500);
    this.name = 'PlaywrightError';
  }
}

// ============================================================================
// SERVER CONFIGURATION TYPES
// ============================================================================

export interface ServerConfig {
  port: number;
  subdomain: string;
  tempDir: string;
  cleanupInterval: number;
  downloadTimeout: number;
  maxConcurrentDownloads: number;
}

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  port: 3000,
  subdomain: 'creative-video-api',
  tempDir: '',
  cleanupInterval: 300000, // 5 minutes
  downloadTimeout: 90000, // 90 seconds
  maxConcurrentDownloads: 10,
};
