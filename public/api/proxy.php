<?php
// Avvalambor barcha xatoliklarni ushlay olish uchun sozlamalar:
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Qattiq xatoliklar (Fatal errors/Syntax errors) ni ushlash:
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR || $error['type'] === E_COMPILE_ERROR)) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'text' => 'Kritik PHP xatosi: ' . $error['message']]);
        exit;
    }
});

// Oddiy xatoliklar (Warnings/Notices) ni ushlash:
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// CORS:
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

    if (!$data || empty($data['url'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'text' => 'Video linki kiritilmadi (URL is required)']);
        exit();
    }

    $targetUrl = $data['url'];
    $quality = isset($data['videoQuality']) ? $data['videoQuality'] : '1080';

    // Eng ishonchli Cobalt API serverlari
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
        'videoQuality' => $quality,
        // Qo'shimcha sozlamalar (ixtiyoriy, API talab qilishi mumkin):
        'isAudioOnly' => false
    ]);

    foreach ($instances as $apiUrl) {
        $response = null;
        $httpcode = 0;

        // 1. Agar cURL bo'lsa, o'shandan foydalanamiz
        if (function_exists('curl_init')) {
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_TIMEOUT, 20); // 20 soniya kutish
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
            // 2. cURL yo'q bo'lsa (Hostinger yoki bepul xostingda), file_get_contents ishlatamiz
            $opts = [
                'http' => [
                    'method'  => 'POST',
                    'header'  => "Accept: application/json\r\n" .
                                 "Content-Type: application/json\r\n" .
                                 "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n",
                    'content' => $payload,
                    'timeout' => 20,
                    'ignore_errors' => true // HTTP xatolar bo'lsa ham javobni o'qish
                ]
            ];
            $context  = stream_context_create($opts);
            $response = @file_get_contents($apiUrl, false, $context);
            
            if ($response !== false && isset($http_response_header)) {
                preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $match);
                $httpcode = (int)$match[1];
            } else {
                $lastErrorMsg = "Faylni o'qish imkonsiz (stream failed)";
            }
        }

        // Javobni tekshirish
        if ($response && $httpcode >= 200 && $httpcode < 300) {
            $responseData = json_decode($response, true);
            // Cobalt ba'zan muvaffaqiyatli ishlasa ham error qaytarishi mumkin (masalan, noto'g'ri havola yuborilganda)
            if ($responseData && (!isset($responseData['status']) || $responseData['status'] !== 'error')) {
                $successResponse = $response;
                break;
            } else if ($responseData && isset($responseData['text'])) {
                 // Foydalanuvchi noto'g'ri link kiritgan bo'lsa, boshqa serverlarga o'tmaslik yaxshiroq, 
                 // biroq Cobalt xatolari ba'zan server bandligini anglatadi. Shuning uchun davom etamiz.
                 $lastErrorMsg = $responseData['text'];
            }
        } else if ($response) {
            $responseData = json_decode($response, true);
            if ($responseData && isset($responseData['text'])) {
                $lastErrorMsg = $responseData['text'];
            } else {
                $lastErrorMsg = "HTTP Xato kodi: " . $httpcode;
            }
        }
    }

    if ($successResponse) {
        http_response_code(200);
        echo $successResponse;
    } else {
        http_response_code(500);
        $finalError = $lastErrorMsg ? $lastErrorMsg : "Barcha Cobalt API serverlari band yoki link formati noto'g'ri.";
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
