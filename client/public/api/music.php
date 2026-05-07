<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataDir = '../data/';
$dataFile = $dataDir . 'music.json';

if (!file_exists($dataDir)) mkdir($dataDir, 0777, true);
if (!file_exists($dataFile)) file_put_contents($dataFile, '[]');

$music = json_decode(file_get_contents($dataFile), true);
if (!is_array($music)) $music = [];

// GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($music);
    exit;
}

// DELETE /api/music.php?id=123
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID kerak']);
        exit;
    }

    $index = null;
    foreach ($music as $i => $m) {
        if (isset($m['id']) && $m['id'] === $id) {
            $index = $i;
            break;
        }
    }

    if ($index === null) {
        http_response_code(404);
        echo json_encode(['error' => 'Musiqa topilmadi']);
        exit;
    }

    $track = $music[$index];
    if (!empty($track['url'])) {
        $fPath = '..' . $track['url'];
        if (file_exists($fPath)) unlink($fPath);
    }

    array_splice($music, $index, 1);
    file_put_contents($dataFile, json_encode(array_values($music), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'message' => '"' . ($track['title'] ?? '') . '" o\'chirildi',
        'deletedId' => $id,
        'totalMusic' => count($music),
    ]);
    exit;
}

// PUT /api/music.php?id=123
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $body = json_decode(file_get_contents('php://input'), true);

    foreach ($music as &$m) {
        if (isset($m['id']) && $m['id'] === $id) {
            if (!empty($body['title'])) $m['title'] = trim($body['title']);
            if (!empty($body['author'])) $m['author'] = trim($body['author']);
            file_put_contents($dataFile, json_encode($music, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(['success' => true, 'message' => "Musiqa yangilandi", 'data' => $m]);
            exit;
        }
    }

    http_response_code(404);
    echo json_encode(['error' => 'Musiqa topilmadi']);
}
