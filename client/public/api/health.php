<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataDir = '../data/';
$videosFile = $dataDir . 'videos.json';
$musicFile = $dataDir . 'music.json';

$videos = file_exists($videosFile) ? json_decode(file_get_contents($videosFile), true) : [];
$music = file_exists($musicFile) ? json_decode(file_get_contents($musicFile), true) : [];
if (!is_array($videos)) $videos = [];
if (!is_array($music)) $music = [];

echo json_encode([
    'status' => 'ok',
    'message' => 'Server ishlamoqda',
    'stats' => [
        'videos' => count($videos),
        'music' => count($music),
    ],
]);
