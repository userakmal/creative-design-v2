<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Faqat POST qabul qilinadi']);
    exit;
}

$password = isset($_POST['password']) ? $_POST['password'] : '';
if ($password !== 'creative2026') {
    http_response_code(401);
    echo json_encode(['error' => "Parol noto'g'ri"]);
    exit;
}

$title = isset($_POST['title']) ? $_POST['title'] : 'Yangi musiqa';
$author = isset($_POST['author']) ? $_POST['author'] : "Noma'lum";

$musicDir = '../music/';
$dataDir = '../data/';
$dataFile = $dataDir . 'music.json';

if (!file_exists($musicDir)) mkdir($musicDir, 0777, true);
if (!file_exists($dataDir)) mkdir($dataDir, 0777, true);

if (!isset($_FILES['music'])) {
    echo json_encode(['error' => 'Musiqa faylni yuklang']);
    exit;
}

$ext = strtolower(pathinfo($_FILES['music']['name'], PATHINFO_EXTENSION));
$allowed = ['mp3', 'm4a', 'wav', 'ogg', 'aac', 'flac'];
if (!in_array($ext, $allowed)) {
    echo json_encode(['error' => "Noto'g'ri format. Faqat: " . implode(', ', $allowed)]);
    exit;
}

$unique = date("U") . rand(1000, 9999);
$fileName = "m_" . $unique . "." . $ext;

if (move_uploaded_file($_FILES['music']['tmp_name'], $musicDir . $fileName)) {
    $musicUrl = "/music/" . $fileName;

    $musicList = [];
    if (file_exists($dataFile)) {
        $decoded = json_decode(file_get_contents($dataFile), true);
        if (is_array($decoded)) $musicList = $decoded;
    }

    $maxId = 48;
    foreach ($musicList as $m) {
        if (isset($m['id']) && $m['id'] > $maxId) $maxId = $m['id'];
    }
    $newId = $maxId + 1;

    $newMusic = [
        'id' => $newId,
        'title' => $title,
        'author' => $author,
        'duration' => '0:00',
        'url' => $musicUrl,
        'uploadedAt' => date('c'),
        'size' => round(filesize($musicDir . $fileName) / 1024) . ' KB',
    ];

    $musicList[] = $newMusic;
    file_put_contents($dataFile, json_encode($musicList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    echo json_encode([
        'success' => true,
        'message' => '"' . $title . '" muvaffaqiyatli yuklandi!',
        'data' => $newMusic,
        'totalMusic' => count($musicList),
    ]);
} else {
    echo json_encode(['error' => 'Faylni saqlashda xatolik']);
}
