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

    $endpoints = [
        base64_decode('aHR0cHM6Ly9hcGkuY29iYWx0LnRvb2xzL2FwaS9qc29u'),
        base64_decode('aHR0cHM6Ly9jby53dWsuc2gvYXBpL2pzb24='),
        base64_decode('aHR0cHM6Ly9jb2JhbHQucXd5aC5kZXYvYXBpL2pzb24='),
        base64_decode('aHR0cHM6Ly9hcGkuY29iYWx0LmxvbC9hcGkvanNvbg=='),
    ];

    $ok = null;
    $err = null;

    $body = json_encode(['url' => $targetUrl, 'videoQuality' => $q]);

    foreach ($endpoints as $ep) {
        $r = null;
        $code = 0;

        if (function_exists('curl_init')) {
            $ch = curl_init($ep);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0'
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

            $r = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if (curl_errno($ch)) {
                $err = curl_error($ch);
            }
            curl_close($ch);
        }

        if ($r && $code >= 200 && $code < 300) {
            $d = json_decode($r, true);
            if ($d && (!isset($d['status']) || $d['status'] !== 'error')) {
                $ok = $r;
                break;
            } else if ($d && isset($d['text'])) {
                $err = $d['text'];
            }
        }
    }

    if (!$ok) {
        $html = '';
        if (function_exists('curl_init')) {
            $ch = curl_init($targetUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['User-Agent: Mozilla/5.0']);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            $html = curl_exec($ch);
            curl_close($ch);
        }

        if ($html) {
            $ext = base64_decode('Lm1wNA==');
            $pattern = '/(https?:\/\/[^\s"\'<>]+?' . preg_quote($ext, '/') . ')/i';
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
            'text' => $err ? $err : 'Topilmadi'
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
