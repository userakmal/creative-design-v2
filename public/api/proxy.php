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

    $q = isset($data['q']) ? $data['q'] : '1080';

    // Cobalt v10/v11 community instances (POST / endpoint)
    $endpoints = [
        'https://cobalt-api.meowing.de/',
        'https://cobalt-backend.canine.tools/',
        'https://capi.3kh0.net/',
        'https://downloadapi.stuff.solutions/',
    ];

    $ok = null;
    $err = null;

    // New Cobalt v10+ API format
    $body = json_encode([
        'url' => $targetUrl,
        'videoQuality' => $q,
        'downloadMode' => 'auto',
        'filenameStyle' => 'basic'
    ]);

    foreach ($endpoints as $ep) {
        $r = null;
        $code = 0;

        if (function_exists('curl_init')) {
            $ch = curl_init($ep);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

            $r = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if (curl_errno($ch)) {
                $err = curl_error($ch);
            }
            curl_close($ch);
        }

        if ($r && $code >= 200 && $code < 300) {
            $d = json_decode($r, true);
            if ($d && isset($d['status'])) {
                // New v10+ response: status can be "tunnel", "redirect", "picker", "error"
                if ($d['status'] === 'tunnel' || $d['status'] === 'redirect') {
                    // Direct download link available
                    $ok = json_encode([
                        'status' => 'success',
                        'url' => $d['url'],
                        'filename' => isset($d['filename']) ? $d['filename'] : 'video.mp4',
                        'type' => 'video'
                    ]);
                    break;
                } else if ($d['status'] === 'picker' && !empty($d['picker'])) {
                    // Multiple items - take first video
                    $pickerUrl = null;
                    foreach ($d['picker'] as $item) {
                        if (isset($item['url'])) {
                            $pickerUrl = $item['url'];
                            break;
                        }
                    }
                    if ($pickerUrl) {
                        $ok = json_encode([
                            'status' => 'success',
                            'url' => $pickerUrl,
                            'filename' => 'video.mp4',
                            'type' => 'video'
                        ]);
                        break;
                    }
                } else if ($d['status'] === 'error') {
                    $errorCode = isset($d['error']) ? $d['error']['code'] : 'unknown';
                    $err = "Cobalt xatosi: " . $errorCode;
                }
            }
        }
    }

    // Fallback: Direct HTML scraping for .mp4 links
    if (!$ok) {
        $html = '';
        if (function_exists('curl_init')) {
            $ch = curl_init($targetUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            $html = curl_exec($ch);
            curl_close($ch);
        }

        if ($html) {
            $pattern = '/(https?:\/\/[^\s"\'<>]+?\.mp4)/i';
            if (preg_match($pattern, $html, $m)) {
                $ok = json_encode([
                    'status' => 'success',
                    'url' => str_replace('\\/', '/', $m[1]),
                    'title' => 'Video',
                    'type' => 'video'
                ]);
            }
        }
    }

    if ($ok) {
        http_response_code(200);
        echo $ok;
    } else {
        http_response_code(200);
        echo json_encode([
            'status' => 'error',
            'text' => $err ? $err : 'Video topilmadi. Boshqa havolani sinang.'
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
