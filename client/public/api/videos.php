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
$dataFile = $dataDir . 'videos.json';

if (!file_exists($dataDir)) mkdir($dataDir, 0777, true);
if (!file_exists($dataFile)) file_put_contents($dataFile, '[]');

$videos = json_decode(file_get_contents($dataFile), true);
if (!is_array($videos)) $videos = [];

// GET /api/videos.php — return all videos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($videos);
    exit;
}

// DELETE /api/videos.php?id=123
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID kerak']);
        exit;
    }

    $index = null;
    foreach ($videos as $i => $v) {
        if (isset($v['id']) && $v['id'] === $id) {
            $index = $i;
            break;
        }
    }

    if ($index === null) {
        http_response_code(404);
        echo json_encode(['error' => 'Video topilmadi']);
        exit;
    }

    $video = $videos[$index];

    // Delete files
    if (!empty($video['videoUrl'])) {
        $vPath = '..' . $video['videoUrl'];
        if (file_exists($vPath)) unlink($vPath);
    }
    if (!empty($video['image'])) {
        $iPath = '..' . $video['image'];
        if (file_exists($iPath)) unlink($iPath);
    }

    array_splice($videos, $index, 1);
    file_put_contents($dataFile, json_encode(array_values($videos), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'message' => '"' . ($video['title'] ?? '') . '" o\'chirildi',
        'deletedId' => $id,
        'totalVideos' => count($videos),
    ]);
    exit;
}

// PUT /api/videos.php?id=123 — rename
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $body = json_decode(file_get_contents('php://input'), true);
    $title = isset($body['title']) ? trim($body['title']) : '';

    if (!$id || !$title) {
        http_response_code(400);
        echo json_encode(['error' => 'ID va nom kerak']);
        exit;
    }

    foreach ($videos as &$v) {
        if (isset($v['id']) && $v['id'] === $id) {
            $v['title'] = $title;
            file_put_contents($dataFile, json_encode($videos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            echo json_encode(['success' => true, 'message' => "Nom o'zgartirildi", 'data' => $v]);
            exit;
        }
    }

    http_response_code(404);
    echo json_encode(['error' => 'Video topilmadi']);
}
