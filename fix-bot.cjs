/**
 * Auto-Fix Script for Telegram Video Downloader Bot
 * This script diagnoses and fixes common issues
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ROOT = __dirname;
const LOCAL_VIDEO_API = path.join(PROJECT_ROOT, 'local-video-api');

console.log('🔧 Telegram Bot Auto-Fix Utility\n');

// Step 1: Check and install yt-dlp
function checkYtDlp() {
    console.log('📦 Checking yt-dlp installation...');
    
    const possiblePaths = [
        path.join(LOCAL_VIDEO_API, 'yt-dlp.exe'),
        path.join(PROJECT_ROOT, 'yt-dlp.exe'),
        'yt-dlp',
    ];
    
    for (const p of possiblePaths) {
        try {
            if (p === 'yt-dlp') {
                execSync(`"${p}" --version`, { stdio: 'pipe' });
                console.log(`   ✅ yt-dlp found in PATH`);
                return true;
            } else if (fs.existsSync(p)) {
                console.log(`   ✅ yt-dlp found at: ${p}`);
                return true;
            }
        } catch {}
    }
    
    console.log('   ❌ yt-dlp NOT FOUND');
    return false;
}

function installYtDlp() {
    console.log('\n📥 Installing yt-dlp...');
    
    const targetPath = path.join(LOCAL_VIDEO_API, 'yt-dlp.exe');
    
    return new Promise((resolve, reject) => {
        console.log('   Downloading from GitHub...');
        
        const file = fs.createWriteStream(targetPath);
        const request = https.get(
            'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            },
            (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Follow redirect
                    https.get(response.headers.location, (redirectResponse) => {
                        redirectResponse.pipe(file);
                        redirectResponse.on('end', () => {
                            console.log('   ✅ yt-dlp.exe downloaded successfully!');
                            resolve(true);
                        });
                    }).on('error', reject);
                } else {
                    response.pipe(file);
                    response.on('end', () => {
                        console.log('   ✅ yt-dlp.exe downloaded successfully!');
                        resolve(true);
                    });
                }
            }
        );
        
        request.on('error', (err) => {
            console.log('   ❌ Download failed:', err.message);
            reject(err);
        });
        
        file.on('error', (err) => {
            fs.unlinkSync(targetPath);
            console.log('   ❌ File write failed:', err.message);
            reject(err);
        });
    });
}

// Step 2: Check Python installation
function checkPython() {
    console.log('\n🐍 Checking Python installation...');
    
    try {
        const version = execSync('python --version', { stdio: 'pipe' }).toString().trim();
        console.log(`   ✅ ${version}`);
        return true;
    } catch {
        try {
            const version = execSync('python3 --version', { stdio: 'pipe' }).toString().trim();
            console.log(`   ✅ ${version}`);
            return true;
        } catch {
            console.log('   ⚠️ Python not found (optional, for pip install method)');
            return false;
        }
    }
}

// Step 3: Check Node.js dependencies
function checkDependencies() {
    console.log('\n📦 Checking Node.js dependencies...');
    
    const requiredDeps = ['telegraf', '@google/generative-ai', 'playwright', 'express', 'cors', 'localtunnel'];
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.log('   ❌ package.json not found!');
        return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    let missing = [];
    for (const dep of requiredDeps) {
        if (!allDeps[dep]) {
            missing.push(dep);
        }
    }
    
    if (missing.length > 0) {
        console.log(`   ⚠️ Missing dependencies: ${missing.join(', ')}`);
        console.log('   Running: npm install');
        try {
            execSync('npm install', { stdio: 'inherit', cwd: PROJECT_ROOT });
            console.log('   ✅ Dependencies installed');
            return true;
        } catch (err) {
            console.log('   ❌ npm install failed');
            return false;
        }
    } else {
        console.log('   ✅ All dependencies present');
        return true;
    }
}

// Step 4: Install Playwright browsers
function installPlaywrightBrowsers() {
    console.log('\n🎭 Checking Playwright browsers...');
    
    try {
        // Check if Chromium is installed
        execSync('npx playwright install chromium --dry-run', { stdio: 'pipe', cwd: PROJECT_ROOT });
        console.log('   ✅ Playwright browsers installed');
        return true;
    } catch {
        console.log('   📥 Installing Playwright Chromium...');
        try {
            execSync('npx playwright install chromium', { 
                stdio: 'inherit', 
                cwd: PROJECT_ROOT,
                env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0' }
            });
            console.log('   ✅ Playwright Chromium installed');
            return true;
        } catch (err) {
            console.log('   ⚠️ Playwright installation failed (will retry on first run)');
            return false;
        }
    }
}

// Step 5: Verify bot token
function verifyBotToken() {
    console.log('\n🤖 Verifying Telegram Bot Token...');
    
    const botToken = process.env.BOT_TOKEN || '8628132129:AAGuU0M2KaZJATpyINnh4xpGoQyXU6uuFso';
    
    return new Promise((resolve) => {
        const request = https.get(
            `https://api.telegram.org/bot${botToken}/getMe`,
            (response) => {
                let data = '';
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        if (result.ok) {
                            console.log(`   ✅ Bot verified: @${result.result.username}`);
                            resolve(true);
                        } else {
                            console.log('   ❌ Invalid bot token');
                            resolve(false);
                        }
                    } catch {
                        console.log('   ❌ Failed to verify bot token');
                        resolve(false);
                    }
                });
            }
        );
        
        request.on('error', (err) => {
            console.log('   ❌ Network error:', err.message);
            resolve(false);
        });
    });
}

// Step 6: Verify Gemini API Key
function verifyGeminiKey() {
    console.log('\n💎 Verifying Gemini API Key...');
    
    const geminiKey = process.env.GEMINI_API_KEY || 'AIzaSyAtfg8YLl_t6I32kL5xGJ-IfdIViWfNfAY';
    
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }]
        });
        
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };
        
        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => { data += chunk; });
            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.candidates && result.candidates.length > 0) {
                        console.log('   ✅ Gemini API working');
                        resolve(true);
                    } else if (result.error) {
                        console.log(`   ❌ Gemini API error: ${result.error.message}`);
                        resolve(false);
                    } else {
                        console.log('   ⚠️ Unexpected response');
                        resolve(false);
                    }
                } catch {
                    console.log('   ❌ Failed to parse response');
                    resolve(false);
                }
            });
        });
        
        request.on('error', (err) => {
            console.log('   ❌ Network error:', err.message);
            resolve(false);
        });
        
        request.write(postData);
        request.end();
    });
}

// Main fix function
async function runAutoFix() {
    console.log('='.repeat(50));
    
    let issuesFixed = 0;
    
    // Check Python
    checkPython();
    
    // Check and install yt-dlp
    if (!checkYtDlp()) {
        try {
            await installYtDlp();
            issuesFixed++;
        } catch (err) {
            console.log('\n⚠️ Could not auto-install yt-dlp');
            console.log('   Manual fix: pip install yt-dlp');
        }
    }
    
    // Check dependencies
    if (checkDependencies()) {
        issuesFixed++;
    }
    
    // Install Playwright browsers
    installPlaywrightBrowsers();
    
    // Verify APIs
    await verifyBotToken();
    await verifyGeminiKey();
    
    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Auto-fix complete! ${issuesFixed} issue(s) addressed.\n`);
    
    console.log('📋 Next steps:');
    console.log('   1. Run: node bot.cjs');
    console.log('   2. Send a video URL to test');
    console.log('   3. Check terminal for detailed logs\n');
    
    console.log('⚠️ If downloads still fail:');
    console.log('   - For Instagram/TikTok: Run /cookies command');
    console.log('   - Check firewall/antivirus settings');
    console.log('   - Try a different video source (YouTube, etc.)\n');
}

runAutoFix().catch(console.error);
