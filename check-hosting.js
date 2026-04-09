/**
 * HOSTING DIAGNOSTIC - SENIOR DEVELOPER TOOL
 * Checks if all files are correctly uploaded to the hosting server
 * 
 * Usage: node check-hosting.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CDN_BASE = 'https://creative-design.uz';

const CHECKS = [
  { name: 'videos.json', url: `${CDN_BASE}/data/videos.json`, type: 'json' },
  { name: 'music.json', url: `${CDN_BASE}/data/music.json`, type: 'json' },
  { name: '.htaccess', url: `${CDN_BASE}/.htaccess`, type: 'text' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a URL is accessible and return status
 */
async function checkURL(check, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(check.url, {
      signal: controller.signal,
      method: check.type === 'json' ? 'GET' : 'HEAD',
    });

    clearTimeout(timeoutId);

    const result = {
      name: check.name,
      url: check.url,
      status: response.status,
      ok: response.ok,
      size: response.headers.get('content-length') || 'unknown',
      contentType: response.headers.get('content-type') || 'unknown',
    };

    if (check.type === 'json' && response.ok) {
      try {
        const data = await response.json();
        result.data = data;
        result.count = Array.isArray(data) ? data.length : 'N/A';
      } catch {
        result.parseError = true;
      }
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      name: check.name,
      url: check.url,
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Get local file count and sizes
 */
function getLocalStats(dirName) {
  const fullPath = path.join(__dirname, 'public', dirName);
  
  if (!fs.existsSync(fullPath)) {
    return { exists: false, files: 0, size: 0 };
  }

  const files = fs.readdirSync(fullPath).filter(f => {
    const stat = fs.statSync(path.join(fullPath, f));
    return stat.isFile();
  });

  const totalSize = files.reduce((sum, file) => {
    const stat = fs.statSync(path.join(fullPath, file));
    return sum + stat.size;
  }, 0);

  return {
    exists: true,
    files: files.length,
    size: totalSize,
    sizeFormatted: formatSize(totalSize),
    fileNames: files,
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================================================
// MAIN DIAGNOSTIC
// ============================================================================

async function runDiagnostics() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  🔍 HOSTING DIAGNOSTIC - SENIOR DEVELOPER TOOL     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 CDN Base: ${CDN_BASE}`);
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log('');

  // 1. LOCAL FILE STATS
  console.log('══════════════════════════════════════════════════════');
  console.log('📊 LOCAL FILE STATISTICS');
  console.log('══════════════════════════════════════════════════════');
  
  const dirs = ['videos', 'image', 'music', 'data', 'logo'];
  
  for (const dir of dirs) {
    const stats = getLocalStats(dir);
    const icon = stats.exists ? '✅' : '❌';
    console.log(`${icon} /${dir}/: ${stats.files} files (${stats.sizeFormatted})`);
    
    // Show specific files for data directory
    if (dir === 'data' && stats.fileNames) {
      stats.fileNames.forEach(f => {
        const fullPath = path.join(__dirname, 'public', 'data', f);
        const content = fs.readFileSync(fullPath, 'utf-8');
        try {
          const data = JSON.parse(content);
          console.log(`   📄 ${f}: ${data.length} items`);
        } catch {
          console.log(`   📄 ${f}: ${formatSize(fs.statSync(fullPath).size)}`);
        }
      });
    }
    
    // Show recent video files
    if (dir === 'videos' && stats.fileNames) {
      const videoFiles = stats.fileNames.filter(f => f.endsWith('.mp4'));
      const recentVideos = videoFiles.slice(-3).reverse(); // Last 3
      console.log(`   📹 Recent videos:`);
      recentVideos.forEach(f => {
        const fullPath = path.join(__dirname, 'public', 'videos', f);
        const stat = fs.statSync(fullPath);
        console.log(`      • ${f} (${formatSize(stat.size)})`);
      });
    }
  }

  console.log('');

  // 2. UPLOAD CHECK
  console.log('══════════════════════════════════════════════════════');
  console.log('🌐 HOSTING ACCESSIBILITY CHECK');
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  const results = await Promise.all(CHECKS.map(check => checkURL(check)));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.ok) {
      passed++;
      console.log(`✅ ${result.name}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Size: ${result.size}`);
      console.log(`   Content-Type: ${result.contentType}`);
      
      if (result.count !== undefined) {
        console.log(`   Items: ${result.count}`);
        
        // Show uploaded videos
        if (result.name === 'videos.json' && result.data) {
          console.log(`   📤 Uploaded videos:`);
          result.data.forEach(video => {
            console.log(`      • ID ${video.id}: ${video.title}`);
            console.log(`        Video: ${video.videoUrl}`);
            console.log(`        Image: ${video.image}`);
          });
        }
      }
      
      if (result.parseError) {
        console.log(`   ⚠️ Warning: Failed to parse JSON`);
      }
    } else {
      failed++;
      console.log(`❌ ${result.name}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Error: ${result.error || `HTTP ${result.status}`}`);
    }
    console.log('');
  }

  // 3. VIDEO URL CHECK
  console.log('══════════════════════════════════════════════════════');
  console.log('🎬 UPLOADED VIDEO URL VALIDATION');
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  // Read local videos.json
  const videosJsonPath = path.join(__dirname, 'public', 'data', 'videos.json');
  if (fs.existsSync(videosJsonPath)) {
    try {
      const videosData = JSON.parse(fs.readFileSync(videosJsonPath, 'utf-8'));
      
      if (videosData.length === 0) {
        console.log('⚠️  No uploaded videos found in videos.json');
      } else {
        console.log(`📹 Found ${videosData.length} uploaded video(s):`);
        console.log('');
        
        for (const video of videosData) {
          console.log(`  Video #${video.id}: ${video.title}`);
          
          // Check if URLs are valid format
          const videoUrl = video.videoUrl.startsWith('http') 
            ? video.videoUrl 
            : `${CDN_BASE}${video.videoUrl}`;
          
          const imageUrl = video.image.startsWith('http')
            ? video.image
            : `${CDN_BASE}${video.image}`;
          
          console.log(`    Video URL: ${videoUrl}`);
          console.log(`    Image URL: ${imageUrl}`);
          
          // Verify CDN URLs are correct format
          const isValidVideoUrl = videoUrl.includes('/videos/') && videoUrl.endsWith('.mp4');
          const isValidImageUrl = imageUrl.includes('/image/') && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg'));
          
          if (isValidVideoUrl && isValidImageUrl) {
            console.log(`    ✅ URLs are properly formatted`);
          } else {
            console.log(`    ❌ URL format may be incorrect`);
          }
          console.log('');
        }
      }
    } catch (error) {
      console.log(`❌ Error reading videos.json: ${error.message}`);
    }
  } else {
    console.log('❌ videos.json file not found locally');
  }

  // 4. SUMMARY
  console.log('══════════════════════════════════════════════════════');
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('══════════════════════════════════════════════════════');
  console.log('');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total Checks: ${CHECKS.length}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('✅ Hosting is properly configured and accessible');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Visit https://creative-design.uz');
    console.log('   2. Open browser console (F12)');
    console.log('   3. Look for video loading logs');
    console.log('   4. Check if uploaded videos appear');
  } else {
    console.log('⚠️  SOME CHECKS FAILED');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Run: node upload-to-hosting.js');
    console.log('   2. Check FTP credentials');
    console.log('   3. Verify server is online');
    console.log('   4. Check hosting panel: https://ns8.sayt.uz:1500/');
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
