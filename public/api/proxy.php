<?php
// Saytning shared xostingida Warning/Notice'lar (masalan ini_set o'chirilganligi) PHP ni buzmasligi uchun:
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

    if (!$data || empty($data['url'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'text' => 'Video linki berilmadi (URL is required)']);
        exit();
    }

    $targetUrl = $data['url'];
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Accept: application/json',
                'Content-Type: application/json',
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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
                    'timeout' => 20,
                    'ignore_errors' => true
                ]
            ];
            $context  = stream_context_create($opts);
            $response = @file_get_contents($apiUrl, false, $context);
            
            if ($response !== false && isset($http_response_header)) {
                if (preg_match('{HTTP\/\S*\s(\d{3})}', $http_response_header[0], $match)) {
                    $httpcode = (int)$match[1];
                }
            } else {
                $lastErrorMsg = "Faylni o'qish imkonsiz (Server blokladi)";
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
        } else if ($response) {
            $responseData = json_decode($response, true);
            if ($responseData && isset($responseData['text'])) {
                $lastErrorMsg = $responseData['text'];
            }
        }
    }

    if ($successResponse) {
        http_response_code(200);
        echo $successResponse;
    } else {
        http_response_code(500);
        $finalError = $lastErrorMsg ? $lastErrorMsg : "Barcha Cobalt API serverlari band yoki xato qaytardi.";
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
