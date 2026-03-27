/**
 * Music Search Module (Shazam-like)
 * Search for songs by name or audio fingerprint
 * 
 * @author G'ulomov Akmal
 * @version 1.0.0
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const https = require('https');

const execPromise = util.promisify(exec);
const ytDlpPath = path.join(__dirname, 'local-video-api', 'yt-dlp.exe');

// ============================================================================
// YOUTUBE SEARCH (Primary method)
// ============================================================================

/**
 * Search YouTube for music
 * @param {string} query - Search query (song name, artist)
 * @returns {Promise<Array>} Search results
 */
const searchYouTube = async (query) => {
    console.log(`[MusicSearch] YouTube search: ${query}`);
    
    const ytcmd = fs.existsSync(ytDlpPath) ? ytDlpPath : 'yt-dlp';
    const searchQuery = `ytsearch10:${query} official audio`;
    
    const command = `"${ytcmd}" --no-check-certificates --extract-audio --audio-format mp3 --dump-json "${searchQuery}"`;
    
    try {
        const { stdout } = await execPromise(command, {
            maxBuffer: 1024 * 1024 * 50,
            timeout: 30000,
        });
        
        // Parse yt-dlp output
        const results = [];
        const lines = stdout.trim().split('\n');
        
        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                results.push({
                    id: data.id,
                    title: data.title || 'Unknown',
                    artist: data.uploader || data.channel || 'Unknown',
                    duration: data.duration || 0,
                    url: data.webpage_url || `https://www.youtube.com/watch?v=${data.id}`,
                    thumbnail: data.thumbnail || data.thumbnails?.[0]?.url,
                    type: 'youtube',
                    source: data.extractor || 'youtube',
                });
            } catch {}
        }
        
        return results.slice(0, 10);
    } catch (error) {
        console.error('[MusicSearch] YouTube search error:', error.message);
        
        // Fallback: return mock results for testing
        return [{
            id: 'fallback',
            title: query,
            artist: 'Unknown Artist',
            duration: 180,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            thumbnail: null,
            type: 'fallback',
            source: 'youtube',
        }];
    }
};

/**
 * Download audio from YouTube
 * @param {string} url - YouTube URL
 * @param {string} outputPath - Output file path
 * @returns {Promise<Object>} Download result
 */
const downloadAudio = async (url, outputPath) => {
    console.log(`[MusicSearch] Downloading audio: ${url}`);
    
    const ytcmd = fs.existsSync(ytDlpPath) ? ytDlpPath : 'yt-dlp';
    
    const command = `"${ytcmd}" --no-check-certificates --extract-audio --audio-format mp3 --audio-quality 128K -o "${outputPath}" "${url}"`;
    
    try {
        await execPromise(command, {
            maxBuffer: 1024 * 1024 * 50,
            timeout: 120000,  // 2 minutes
        });
        
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            return {
                success: true,
                path: outputPath,
                size: stats.size,
            };
        }
        
        return { success: false, error: 'File not created' };
    } catch (error) {
        console.error('[MusicSearch] Download error:', error.message);
        return { success: false, error: error.message };
    }
};

// ============================================================================
// ACRCLOUD FINGERPRINTING (Optional - requires API key)
// ============================================================================

/**
 * Recognize song from audio file using ACRCloud
 * @param {string} audioPath - Path to audio file
 * @param {string} apiKey - ACRCloud API key (optional)
 * @returns {Promise<Object|null>} Recognition result
 */
const recognizeWithACRCloud = async (audioPath, apiKey = null) => {
    if (!apiKey) {
        console.log('[MusicSearch] ACRCloud API key not provided, skipping fingerprint recognition');
        return null;
    }
    
    console.log('[MusicSearch] Recognizing with ACRCloud...');
    
    try {
        const audioData = fs.readFileSync(audioPath);
        
        const formData = new FormData();
        formData.append('audio', audioData);
        formData.append('access_key', apiKey);
        
        // ACRCloud API call would go here
        // This is a placeholder - implement based on ACRCloud docs
        
        return null;
    } catch (error) {
        console.error('[MusicSearch] ACRCloud error:', error.message);
        return null;
    }
};

// ============================================================================
// MUSIC SEARCH WITH CACHING
// ============================================================================

const { cacheMusicSearch, getCachedMusicSearch } = require('./database.cjs');

/**
 * Search for music with caching
 * @param {string} query - Search query
 * @param {boolean} useCache - Use cached results
 * @returns {Promise<Array>} Search results
 */
const searchMusic = async (query, useCache = true) => {
    // Check cache first
    if (useCache) {
        const cached = getCachedMusicSearch(query);
        if (cached) {
            console.log('[MusicSearch] Using cached results');
            return cached;
        }
    }
    
    // Search YouTube
    const results = await searchYouTube(query);
    
    // Cache results
    if (results.length > 0) {
        cacheMusicSearch(query, results);
    }
    
    return results;
};

// ============================================================================
// INLINE KEYBOARD GENERATION
// ============================================================================

const { Markup } = require('telegraf');

/**
 * Generate inline keyboard for music search results
 * @param {Array} results - Search results
 * @param {string} queryId - Unique query identifier
 * @returns {Markup} Inline keyboard
 */
const generateMusicKeyboard = (results, queryId) => {
    const keyboard = [];
    
    // Show top 5 results
    const topResults = results.slice(0, 5);
    
    topResults.forEach((result, index) => {
        const duration = result.duration 
            ? `${Math.floor(result.duration / 60)}:${(result.duration % 60).toString().padStart(2, '0')}`
            : '?';
        
        keyboard.push([{
            text: `🎵 ${result.title.substring(0, 50)} (${duration})`,
            callback_data: `music_${queryId}_${index}_${result.id}`,
        }]);
    });
    
    // Refresh button
    keyboard.push([{
        text: '🔄 Yangilash',
        callback_data: `music_refresh_${queryId}`,
    }]);
    
    // Cancel button
    keyboard.push([{
        text: '❌ Bekor qilish',
        callback_data: `music_cancel_${queryId}`,
    }]);
    
    return Markup.inlineKeyboard(keyboard);
};

/**
 * Format music search results message
 * @param {string} query - Search query
 * @param {Array} results - Search results
 * @returns {string} Formatted message
 */
const formatMusicResults = (query, results) => {
    let message = `🎵 **Musiqa Topildi**\n\n`;
    message += `🔍 **Qidiruv:** ${query}\n\n`;
    message += `📊 **Topildi:** ${results.length} ta variant\n\n`;
    message += `⬇️ **Kerakli variantni tanlang:**`;
    
    return message;
};

// ============================================================================
// QUERY ID MANAGEMENT
// ============================================================================

// Store for music searches: queryId -> { query, results, userId, chatId }
const musicSearches = new Map();

/**
 * Generate unique query ID
 * @returns {string} Query ID
 */
const generateQueryId = () => {
    return `mq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

/**
 * Store music search
 * @param {string} queryId - Query ID
 * @param {Object} data - Search data
 */
const storeMusicSearch = (queryId, data) => {
    musicSearches.set(queryId, {
        ...data,
        timestamp: Date.now(),
    });
    
    // Auto-cleanup after 5 minutes
    setTimeout(() => {
        musicSearches.delete(queryId);
    }, 5 * 60 * 1000);
};

/**
 * Get stored music search
 * @param {string} queryId - Query ID
 * @returns {Object|null} Search data
 */
const getMusicSearch = (queryId) => {
    return musicSearches.get(queryId) || null;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Search functions
    searchYouTube,
    searchMusic,
    recognizeWithACRCloud,
    
    // Download functions
    downloadAudio,
    
    // UI functions
    generateMusicKeyboard,
    formatMusicResults,
    
    // Query management
    generateQueryId,
    storeMusicSearch,
    getMusicSearch,
    
    // Direct access
    musicSearches,
};
