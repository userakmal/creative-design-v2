<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

function exception_error_handler($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'text' => "PHP Error: $message"]);
    exit;
}
set_error_handler("exception_error_handler");

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request payload
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['url'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'text' => 'Video URL is required']);
    exit();
}

$targetUrl = $data['url'];
$quality = isset($data['videoQuality']) ? $data['videoQuality'] : '1080';

// List of instances to try
$instances = [
    "https://api.cobalt.tools",
    "https://co.wuk.sh",
    "https://cobalt.qwyh.dev",
    "https://api.cobalt.lol"
];

$successResponse = null;
$lastError = null;

foreach ($instances as $instance) {
    if ($instance === "https://api.cobalt.tools") {
        // Cobalt's new API domain is api.cobalt.tools/api/json
        $apiUrl = $instance . "/api/json"; 
    } else {
        $apiUrl = $instance;
    }

    $ch = curl_init($apiUrl);
    
    $payload = json_encode([
        'url' => $targetUrl,
        'videoQuality' => $quality
    ]);

    // Set specific headers that Cobalt instances expect
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Accept: application/json',
        'Content-Type: application/json',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ));
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        $lastError = curl_error($ch);
        curl_close($ch);
        continue;
    }
    
    curl_close($ch);

    if ($httpcode >= 200 && $httpcode < 300) {
        $responseData = json_decode($response, true);
        if ($responseData && (!isset($responseData['status']) || $responseData['status'] !== 'error')) {
            $successResponse = $response;
            break;
        }
    }
}

if ($successResponse) {
    echo $successResponse;
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'text' => 'Barcha serverlar band yoki ulanishda xatolik. Iltimos keyinroq qayta urinib ko\'ring.'
    ]);
}
?>
