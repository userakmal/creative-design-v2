/**
 * Simple JSON Database for Caching
 * Stores cached videos, music searches, and user data
 * 
 * @author G'ulomov Akmal
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Initialize database structure
const defaultDB = {
    cachedVideos: {},      // { url: { fileId, fileSize, title, quality, cachedAt } }
    musicSearches: {},     // { query: { results: [], searchedAt } }
    userStats: {},         // { userId: { messagesCount, videosDownloaded, lastActive } }
    settings: {
        cacheExpiry: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
        maxCacheSize: 1000,  // Maximum cached videos
    }
};

/**
 * Load database from file
 * @returns {Object} Database object
 */
const loadDB = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            const parsed = JSON.parse(data);
            return { ...defaultDB, ...parsed };
        }
    } catch (error) {
        console.error('[Database] Load error:', error.message);
    }
    
    // Return default and save
    saveDB(defaultDB);
    return defaultDB;
};

/**
 * Save database to file
 * @param {Object} db - Database object to save
 */
const saveDB = (db) => {
    try {
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('[Database] Save error:', error.message);
        return false;
    }
};

// Cache database in memory
let dbCache = null;
let lastLoad = 0;
const CACHE_TTL = 5000;  // 5 seconds

/**
 * Get database instance (with memory caching)
 * @returns {Object} Database object
 */
const getDB = () => {
    const now = Date.now();
    if (!dbCache || (now - lastLoad) > CACHE_TTL) {
        dbCache = loadDB();
        lastLoad = now;
    }
    return dbCache;
};

/**
 * Sync database to disk
 */
const syncDB = () => {
    if (dbCache) {
        saveDB(dbCache);
    }
};

// ============================================================================
// CACHED VIDEOS OPERATIONS
// ============================================================================

/**
 * Cache a video file_id
 * @param {string} url - Video URL
 * @param {Object} videoData - { fileId, fileSize, title, quality, duration }
 * @returns {boolean} Success status
 */
const cacheVideo = (url, videoData) => {
    const db = getDB();
    
    db.cachedVideos[url] = {
        fileId: videoData.fileId,
        fileSize: videoData.fileSize,
        title: videoData.title,
        quality: videoData.quality || 'unknown',
        duration: videoData.duration,
        cachedAt: Date.now(),
        downloadCount: 0,
    };
    
    // Cleanup if cache is too large
    const cacheKeys = Object.keys(db.cachedVideos);
    if (cacheKeys.length > db.settings.maxCacheSize) {
        // Remove oldest entries
        const sorted = cacheKeys.sort((a, b) => 
            db.cachedVideos[a].cachedAt - db.cachedVideos[b].cachedAt
        );
        
        // Remove oldest 10%
        const toRemove = sorted.slice(0, Math.floor(cacheKeys.length * 0.1));
        toRemove.forEach(key => delete db.cachedVideos[key]);
    }
    
    syncDB();
    return true;
};

/**
 * Get cached video by URL
 * @param {string} url - Video URL
 * @returns {Object|null} Cached video data or null
 */
const getCachedVideo = (url) => {
    const db = getDB();
    const cached = db.cachedVideos[url];
    
    if (!cached) {
        return null;
    }
    
    // Check if cache expired
    const age = Date.now() - cached.cachedAt;
    if (age > db.settings.cacheExpiry) {
        delete db.cachedVideos[url];
        syncDB();
        return null;
    }
    
    // Increment download count
    cached.downloadCount = (cached.downloadCount || 0) + 1;
    syncDB();
    
    return cached;
};

/**
 * Check if video is cached
 * @param {string} url - Video URL
 * @returns {boolean} Is cached
 */
const isVideoCached = (url) => {
    return getCachedVideo(url) !== null;
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
const getCacheStats = () => {
    const db = getDB();
    const videos = Object.values(db.cachedVideos);
    
    const totalSize = videos.reduce((sum, v) => sum + (v.fileSize || 0), 0);
    const totalDownloads = videos.reduce((sum, v) => sum + (v.downloadCount || 0), 0);
    
    return {
        totalVideos: videos.length,
        totalSize: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
        totalDownloads,
        oldestCache: videos.length > 0 
            ? Math.min(...videos.map(v => v.cachedAt)) 
            : null,
    };
};

/**
 * Clear expired cache entries
 * @returns {number} Number of entries cleared
 */
const clearExpiredCache = () => {
    const db = getDB();
    const now = Date.now();
    let cleared = 0;
    
    Object.keys(db.cachedVideos).forEach(url => {
        const age = now - db.cachedVideos[url].cachedAt;
        if (age > db.settings.cacheExpiry) {
            delete db.cachedVideos[url];
            cleared++;
        }
    });
    
    if (cleared > 0) {
        syncDB();
        console.log(`[Database] Cleared ${cleared} expired cache entries`);
    }
    
    return cleared;
};

/**
 * Clear all cache
 * @returns {boolean} Success status
 */
const clearAllCache = () => {
    const db = getDB();
    db.cachedVideos = {};
    syncDB();
    return true;
};

// ============================================================================
// MUSIC SEARCH OPERATIONS
// ============================================================================

/**
 * Cache music search results
 * @param {string} query - Search query
 * @param {Array} results - Search results
 * @returns {boolean} Success status
 */
const cacheMusicSearch = (query, results) => {
    const db = getDB();
    
    db.musicSearches[query.toLowerCase()] = {
        query,
        results,
        searchedAt: Date.now(),
        accessCount: 0,
    };
    
    // Limit music search cache size
    const searchKeys = Object.keys(db.musicSearches);
    if (searchKeys.length > 500) {
        const sorted = searchKeys.sort((a, b) => 
            db.musicSearches[a].searchedAt - db.musicSearches[b].searchedAt
        );
        const toRemove = sorted.slice(0, 100);
        toRemove.forEach(key => delete db.musicSearches[key]);
    }
    
    syncDB();
    return true;
};

/**
 * Get cached music search results
 * @param {string} query - Search query
 * @returns {Array|null} Search results or null
 */
const getCachedMusicSearch = (query) => {
    const db = getDB();
    const cached = db.musicSearches[query.toLowerCase()];
    
    if (!cached) {
        return null;
    }
    
    // Cache for 1 hour
    const age = Date.now() - cached.searchedAt;
    if (age > 60 * 60 * 1000) {
        delete db.musicSearches[query.toLowerCase()];
        syncDB();
        return null;
    }
    
    cached.accessCount = (cached.accessCount || 0) + 1;
    syncDB();
    
    return cached.results;
};

// ============================================================================
// USER STATS OPERATIONS
// ============================================================================

/**
 * Update user statistics
 * @param {number} userId - User ID
 * @param {Object} data - Update data
 * @returns {boolean} Success status
 */
const updateUserStats = (userId, data) => {
    const db = getDB();
    
    if (!db.userStats[userId]) {
        db.userStats[userId] = {
            messagesCount: 0,
            videosDownloaded: 0,
            musicSearched: 0,
            firstUsed: Date.now(),
            lastActive: Date.now(),
        };
    }
    
    const stats = db.userStats[userId];
    
    if (data.messagesCount) stats.messagesCount++;
    if (data.videosDownloaded) stats.videosDownloaded++;
    if (data.musicSearched) stats.musicSearched++;
    stats.lastActive = Date.now();
    
    syncDB();
    return true;
};

/**
 * Get user statistics
 * @param {number} userId - User ID
 * @returns {Object|null} User stats or null
 */
const getUserStats = (userId) => {
    const db = getDB();
    return db.userStats[userId] || null;
};

/**
 * Get all user stats (for admin)
 * @returns {Object} All user stats
 */
const getAllUserStats = () => {
    const db = getDB();
    return db.userStats;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Database operations
    getDB,
    syncDB,
    
    // Video cache
    cacheVideo,
    getCachedVideo,
    isVideoCached,
    getCacheStats,
    clearExpiredCache,
    clearAllCache,
    
    // Music search cache
    cacheMusicSearch,
    getCachedMusicSearch,
    
    // User stats
    updateUserStats,
    getUserStats,
    getAllUserStats,
    
    // Direct DB access (for advanced operations)
    loadDB,
    saveDB,
};
