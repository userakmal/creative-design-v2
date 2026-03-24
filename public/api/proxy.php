<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['status' => 'ok']);
    exit();
}

function curlGet($url, $extraHeaders = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $headers = array_merge([
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language: en-US,en;q=0.9',
    ], $extraHeaders);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

function curlPost($url, $body, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $allHeaders = array_merge([
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ], $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $allHeaders);
    $result = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['body' => $result, 'code' => $code];
}

// ========== YOUTUBE ==========
function downloadYouTube($url) {
    // Extract video ID
    $videoId = null;
    if (preg_match('/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $m)) {
        $videoId = $m[1];
    }
    if (!$videoId) return null;

    // Method 1: YouTube oEmbed (get title)
    $title = 'YouTube Video';
    $oembedUrl = "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=$videoId&format=json";
    $oembed = curlGet($oembedUrl);
    if ($oembed) {
        $oData = json_decode($oembed, true);
        if ($oData && isset($oData['title'])) {
            $title = $oData['title'];
        }
    }

    // Method 2: Try to get video info via innertube API
    $innertubeBody = json_encode([
        'videoId' => $videoId,
        'context' => [
            'client' => [
                'clientName' => 'ANDROID',
                'clientVersion' => '19.09.37',
                'androidSdkVersion' => 30,
                'hl' => 'en',
                'gl' => 'US',
                'utcOffsetMinutes' => 0
            ]
        ]
    ]);

    $resp = curlPost(
        'https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w&prettyPrint=false',
        $innertubeBody,
        ['Content-Type: application/json']
    );

    if ($resp['body'] && $resp['code'] >= 200 && $resp['code'] < 300) {
        $data = json_decode($resp['body'], true);
        if ($data && isset($data['streamingData'])) {
            $formats = [];
            if (isset($data['streamingData']['formats'])) {
                $formats = array_merge($formats, $data['streamingData']['formats']);
            }
            if (isset($data['streamingData']['adaptiveFormats'])) {
                $formats = array_merge($formats, $data['streamingData']['adaptiveFormats']);
            }

            // Pick best mp4 with audio+video
            $bestUrl = null;
            $bestQuality = 0;
            foreach ($formats as $f) {
                if (isset($f['url']) && isset($f['mimeType']) && strpos($f['mimeType'], 'video/mp4') !== false) {
                    if (isset($f['audioQuality'])) { // has audio
                        $h = isset($f['height']) ? (int)$f['height'] : 0;
                        if ($h > $bestQuality) {
                            $bestQuality = $h;
                            $bestUrl = $f['url'];
                        }
                    }
                }
            }
            if ($bestUrl) {
                return ['url' => $bestUrl, 'title' => $title, 'type' => 'video'];
            }

            // If no combined, try any format with url
            foreach ($formats as $f) {
                if (isset($f['url'])) {
                    return ['url' => $f['url'], 'title' => $title, 'type' => 'video'];
                }
            }
        }
    }

    // Method 3: Try WEB client
    $webBody = json_encode([
        'videoId' => $videoId,
        'context' => [
            'client' => [
                'clientName' => 'WEB',
                'clientVersion' => '2.20240101.00.00',
                'hl' => 'en',
                'gl' => 'US'
            ]
        ]
    ]);

    $resp2 = curlPost(
        'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false',
        $webBody,
        ['Content-Type: application/json']
    );

    if ($resp2['body'] && $resp2['code'] >= 200 && $resp2['code'] < 300) {
        $data2 = json_decode($resp2['body'], true);
        if ($data2 && isset($data2['streamingData']['formats'])) {
            foreach ($data2['streamingData']['formats'] as $f) {
                if (isset($f['url'])) {
                    return ['url' => $f['url'], 'title' => $title, 'type' => 'video'];
                }
            }
        }
    }

    return null;
}

// ========== TIKTOK ==========
function downloadTikTok($url) {
    // Step 1: Follow redirects to get final URL
    $html = curlGet($url);
    if (!$html) return null;

    // Try to find video URL in page source
    // TikTok embeds video URLs in JSON data
    $patterns = [
        '/"playAddr"\s*:\s*"(https?:[^"]+)"/',
        '/"downloadAddr"\s*:\s*"(https?:[^"]+)"/',
        '/\"urls\"\s*:\s*\[\s*\"(https?:[^\"]+)\"/',
        '/"playUrl"\s*:\s*"(https?:[^"]+)"/',
    ];

    foreach ($patterns as $p) {
        if (preg_match($p, $html, $m)) {
            $videoUrl = str_replace(['\\u002F', '\\/'], '/', $m[1]);
            return ['url' => $videoUrl, 'title' => 'TikTok Video', 'type' => 'video'];
        }
    }

    // Try og:video
    if (preg_match('/property="og:video(?::url)?"\s+content="([^"]+)"/i', $html, $m)) {
        return ['url' => $m[1], 'title' => 'TikTok Video', 'type' => 'video'];
    }

    // Try meta tag with downloadAddr
    if (preg_match('/downloadAddr.*?(https?:\/\/[^\s"\'<>]+\.mp4[^\s"\'<>]*)/i', $html, $m)) {
        return ['url' => html_entity_decode($m[1]), 'title' => 'TikTok Video', 'type' => 'video'];
    }

    return null;
}

// ========== INSTAGRAM ==========
function downloadInstagram($url) {
    $html = curlGet($url, ['Accept: text/html,application/xhtml+xml']);
    if (!$html) return null;

    // Try og:video meta tag
    if (preg_match('/property="og:video"\s+content="([^"]+)"/i', $html, $m)) {
        return ['url' => html_entity_decode($m[1]), 'title' => 'Instagram Video', 'type' => 'video'];
    }

    // Try to find video_url in JSON
    if (preg_match('/"video_url"\s*:\s*"(https?:[^"]+)"/i', $html, $m)) {
        $videoUrl = str_replace(['\\u0026', '\\/', '\\u002F'], ['&', '/', '/'], $m[1]);
        return ['url' => $videoUrl, 'title' => 'Instagram Video', 'type' => 'video'];
    }

    // Try content_url patterns
    if (preg_match('/contentUrl.*?(https?:\/\/[^\s"\'<>]+\.mp4[^\s"\'<>]*)/i', $html, $m)) {
        return ['url' => html_entity_decode($m[1]), 'title' => 'Instagram Video', 'type' => 'video'];
    }

    return null;
}

// ========== GENERIC FALLBACK ==========
function downloadGeneric($url) {
    $html = curlGet($url);
    if (!$html) return null;

    // Try og:video
    if (preg_match('/property="og:video(?::url)?"\s+content="([^"]+)"/i', $html, $m)) {
        return ['url' => html_entity_decode($m[1]), 'title' => 'Video', 'type' => 'video'];
    }

    // Try to find .mp4 links
    if (preg_match('/(https?:\/\/[^\s"\'<>]+?\.mp4(?:\?[^\s"\'<>]*)?)/i', $html, $m)) {
        return ['url' => html_entity_decode($m[1]), 'title' => 'Video', 'type' => 'video'];
    }

    // Try video src
    if (preg_match('/<video[^>]*src="([^"]+)"/i', $html, $m)) {
        $src = $m[1];
        if (strpos($src, 'http') !== 0) {
            $parsed = parse_url($url);
            $src = $parsed['scheme'] . '://' . $parsed['host'] . $src;
        }
        return ['url' => html_entity_decode($src), 'title' => 'Video', 'type' => 'video'];
    }

    // Try source tag inside video
    if (preg_match('/<source[^>]*src="([^"]+)"[^>]*type="video/i', $html, $m)) {
        $src = $m[1];
        if (strpos($src, 'http') !== 0) {
            $parsed = parse_url($url);
            $src = $parsed['scheme'] . '://' . $parsed['host'] . $src;
        }
        return ['url' => html_entity_decode($src), 'title' => 'Video', 'type' => 'video'];
    }

    return null;
}

// ========== MAIN ==========
try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $targetUrl = '';
    if (!empty($data['u'])) {
        $targetUrl = base64_decode($data['u']);
    }
    if (empty($targetUrl)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'text' => 'URL kerak']);
        exit();
    }

    $result = null;

    // Detect platform and use appropriate downloader
    if (preg_match('/youtube\.com|youtu\.be/i', $targetUrl)) {
        $result = downloadYouTube($targetUrl);
    } else if (preg_match('/tiktok\.com/i', $targetUrl)) {
        $result = downloadTikTok($targetUrl);
    } else if (preg_match('/instagram\.com/i', $targetUrl)) {
        $result = downloadInstagram($targetUrl);
    }

    // Generic fallback for any URL
    if (!$result) {
        $result = downloadGeneric($targetUrl);
    }

    if ($result) {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'url' => $result['url'],
            'title' => $result['title'],
            'type' => $result['type']
        ]);
    } else {
        http_response_code(200);
        echo json_encode([
            'status' => 'error',
            'text' => 'Video topilmadi. Bu sahifada video yo\'q yoki himoyalangan.'
        ]);
    }

} catch (Exception $e) {
    http_response_code(200);
    echo json_encode([
        'status' => 'error',
        'text' => $e->getMessage()
    ]);
}
?>
