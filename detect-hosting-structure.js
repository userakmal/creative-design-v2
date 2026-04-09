/**
 * DETECT HOSTING STRUCTURE
 * Checks whether the hosting uses /videos/ or /media/ paths
 */

const CDN_BASE = 'https://creative-design.uz';

// Test different path variations
const PATHS_TO_TEST = [
  // Video paths
  { name: 'Built-in Video (videos/)', url: `${CDN_BASE}/videos/v1.mp4` },
  { name: 'Built-in Video (media/)', url: `${CDN_BASE}/media/v1.mp4` },
  
  // Uploaded video paths
  { name: 'Uploaded Video (videos/)', url: `${CDN_BASE}/videos/v_1775037830219-84304006.mp4` },
  { name: 'Uploaded Video (media/)', url: `${CDN_BASE}/media/v_1775037830219-84304006.mp4` },
  
  // Image paths
  { name: 'Built-in Image (image/)', url: `${CDN_BASE}/image/i1.jpg` },
  { name: 'Built-in Image (media/image/)', url: `${CDN_BASE}/media/image/i1.jpg` },
  
  // Uploaded image paths
  { name: 'Uploaded Image (image/)', url: `${CDN_BASE}/image/i_1775037830271-242443065.jpg` },
  { name: 'Uploaded Image (media/image/)', url: `${CDN_BASE}/media/image/i_1775037830271-242443065.jpg` },
  
  // Data paths
  { name: 'videos.json (data/)', url: `${CDN_BASE}/data/videos.json` },
  { name: 'videos.json (media/data/)', url: `${CDN_BASE}/media/data/videos.json` },
];

console.log('🔍 DETECTING HOSTING STRUCTURE...\n');
console.log(`CDN Base: ${CDN_BASE}\n`);

let results = [];

for (const test of PATHS_TO_TEST) {
  try {
    const res = await fetch(test.url, { method: 'HEAD' });
    const size = res.headers.get('content-length');
    const contentType = res.headers.get('content-type');
    
    const result = {
      name: test.name,
      url: test.url,
      status: res.status,
      ok: res.ok,
      size: size ? (parseInt(size) / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A',
      contentType: contentType || 'N/A',
    };
    
    results.push(result);
    
    console.log(`${result.ok ? '✅' : '❌'} ${result.name}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Size: ${result.size}`);
    console.log(`   Type: ${result.contentType}`);
    console.log('');
  } catch (err) {
    console.log(`❌ ${test.name}`);
    console.log(`   Error: ${err.message}\n`);
  }
}

// Summary
console.log('═══════════════════════════════════════════');
console.log('📊 HOSTING STRUCTURE ANALYSIS');
console.log('═══════════════════════════════════════════\n');

const workingPaths = results.filter(r => r.ok);
const failedPaths = results.filter(r => !r.ok);

console.log(`✅ Working: ${workingPaths.length}`);
console.log(`❌ Failed: ${failedPaths.length}`);
console.log('');

if (workingPaths.length > 0) {
  console.log('✅ WORKING PATHS:');
  workingPaths.forEach(p => {
    console.log(`   • ${p.url}`);
  });
  console.log('');
  
  // Determine the correct base path
  const videoPath = workingPaths.find(p => p.url.includes('.mp4'));
  const imagePath = workingPaths.find(p => p.url.includes('.jpg'));
  
  if (videoPath) {
    const match = videoPath.url.match(/https?:\/\/[^/]+(\/[^/]+)\//);
    if (match) {
      console.log(`🎯 CORRECT VIDEO PATH: ${match[1]}/`);
    }
  }
  
  if (imagePath) {
    const match = imagePath.url.match(/https?:\/\/[^/]+(\/[^/]+)\//);
    if (match) {
      console.log(`🖼️ CORRECT IMAGE PATH: ${match[1]}/`);
    }
  }
}
