/**
 * Test script to verify video download functionality
 */

const { downloadWithYtDlp, sniffWithPlaywright, isM3U8, isDirectVideo } = require('./local-video-api/server');

async function testDownload() {
    console.log('🧪 Video Download Test Suite\n');
    
    // Test URLs
    const testCases = [
        {
            name: 'Instagram Reel',
            url: 'https://www.instagram.com/reel/DWVbyIliop7/?igsh=MWhjeTZ2Z2U4NWhybA==',
            expectSuccess: true
        },
        {
            name: 'Direct MP4',
            url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            expectSuccess: true
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`   URL: ${testCase.url}`);
        
        try {
            console.log('   Method 1: yt-dlp...');
            const result = await downloadWithYtDlp(testCase.url);
            console.log('   ✅ SUCCESS');
            console.log(`   Title: ${result.title}`);
            console.log(`   URL: ${result.url?.substring(0, 100) || 'N/A'}...`);
            console.log(`   Duration: ${result.duration || 'N/A'}s`);
            console.log(`   Type: ${result.type}`);
        } catch (error) {
            console.log('   ❌ FAILED:', error.message);
            
            try {
                console.log('   Method 2: Playwright...');
                const pwResult = await sniffWithPlaywright(testCase.url);
                console.log('   ✅ SUCCESS');
                console.log(`   URL: ${pwResult.url?.substring(0, 100) || 'N/A'}...`);
            } catch (pwError) {
                console.log('   ❌ Playwright also failed:', pwError.message);
            }
        }
        
        console.log('   ---');
    }
    
    console.log('\n✅ Test suite complete!\n');
}

testDownload().catch(console.error);
