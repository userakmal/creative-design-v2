<?php
// Saytning shared xostingida Warning/Notice'lar PHP ni buzmasligi uchun:
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

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    $targetUrl = '';
    // ModSecurity va WAF firewall'larni aylanib o'tish uchun Base64 decode:
    if (!empty($data['url_b64'])) {
        $targetUrl = base64_decode($data['url_b64']);
    } else if (!empty($data['url'])) {
        $targetUrl = $data['url'];
    }

    if (empty($targetUrl)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'text' => 'Video linki berilmadi (URL is required)']);
        exit();
    }

    $quality = isset($data['videoQuality']) ? $data['videoQuality'] : '1080';

    // Cobalt API serverlari
    $instances = [
        "https://api.cobalt.tools/api/json",
        "https://co.wuk.sh/api/json",
        "https://cobalt.qwyh.dev/api/json",
        "https://api.cobalt.lol/api/json"
    ];

    $successResponse = null;
    $lastErrorMsg = null;

    $payload = json_encode([
        'url' => $targetUrl,
        'videoQuality' => $quality
    ]);

    foreach ($instances as $apiUrl) {
        $response = null;
        $httpcode = 0;

        if (function_exists('curl_init')) {
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Accept: application/json',
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ));
            
            $response = curl_exec($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if (curl_errno($ch)) {
                $lastErrorMsg = "cURL xatosi: " . curl_error($ch);
            }
            curl_close($ch);
        } else {
            $opts = [
                'http' => [
                    'method'  => 'POST',
                    'header'  => "Accept: application/json\r\n" .
                                 "Content-Type: application/json\r\n" .
                                 "User-Agent: Mozilla/5.0\r\n",
                    'content' => $payload,
                    'timeout' => 15,
                    'ignore_errors' => true
                ]
            ];
            $context  = stream_context_create($opts);
            $response = @file_get_contents($apiUrl, false, $context);
            if ($response !== false && isset($http_response_header)) {
                if (preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $match)) {
                    $httpcode = (int)$match[1];
                }
            }
        }

        if ($response && $httpcode >= 200 && $httpcode < 300) {
            $responseData = json_decode($response, true);
            if ($responseData && (!isset($responseData['status']) || $responseData['status'] !== 'error')) {
                $successResponse = $response;
                break;
            } else if ($responseData && isset($responseData['text'])) {
                $lastErrorMsg = $responseData['text'];
            }
        }
    }

    // 2-QADAM: AGAR COBALT YORDAM BERMASA yoki NOMALUM SAYTLAR BO'LSA
    // saytning o'zini kodini (HTML) tortib, ichidan ".mp4" formatidagi linkni topishga usta skeyper:
    if (!$successResponse) {
        $html = '';
        if (function_exists('curl_init')) {
            $ch = curl_init($targetUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"]);
            $html = curl_exec($ch);
            curl_close($ch);
        } else {
            $opts = ['http' => ['method' => 'GET', 'header' => "User-Agent: Mozilla/5.0\r\n", 'timeout' => 15]];
            $context  = stream_context_create($opts);
            $html = @file_get_contents($targetUrl, false, $context);
        }

        if ($html) {
            // Skript: "http" yoki "https" bilan boshlanadigan, bo'shliqsiz, .mp4 bilan tugaydigan eng aniq manzilni izlash.
            // Bu "kattalar" yoki boshqa har qanday to'g'ridan-to'g'ri .mp4 tarqatadigan tube saytlarda mukammal ishlaydi!
            if (preg_match('/(https?:\/\/[^\s"\'<>]+?\.mp4)/i', $html, $matches)) {
                $mp4Url = str_replace('\\/', '/', $matches[1]);
                $successResponse = json_encode([
                    'status' => 'success',
                    'url' => $mp4Url,
                    'title' => 'Maxsus saytdan ajratib olingan video',
                    'type' => 'video'
                ]);
            }
        }
    }

    if ($successResponse) {
        http_response_code(200);
        echo $successResponse;
    } else {
        http_response_code(500);
        $finalError = $lastErrorMsg ? $lastErrorMsg : "Bu saytdan videoni yuklashning imkoni bo'lmadi yoki himoyalangan.";
        echo json_encode([
            'status' => 'error', 
            'text' => $finalError
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'text' => 'Kutilmagan xato: ' . $e->getMessage()
    ]);
}
?>
