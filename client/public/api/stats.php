<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataDir = '../data/';
$videosFile = $dataDir . 'videos.json';
$musicFile = $dataDir . 'music.json';

$videos = file_exists($videosFile) ? json_decode(file_get_contents($videosFile), true) : [];
$music = file_exists($musicFile) ? json_decode(file_get_contents($musicFile), true) : [];
if (!is_array($videos)) $videos = [];
if (!is_array($music)) $music = [];

// Calculate disk usage
$totalSize = 0;
$dirs = ['../videos', '../image', '../music'];
foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        foreach (scandir($dir) as $f) {
            if ($f === '.' || $f === '..') continue;
            $totalSize += filesize($dir . '/' . $f);
        }
    }
}

$diskUsage = $totalSize < 1024 * 1024
    ? round($totalSize / 1024, 1) . ' KB'
    : round($totalSize / (1024 * 1024), 1) . ' MB';

echo json_encode([
    'videos' => count($videos),
    'music' => count($music),
    'diskUsage' => $diskUsage,
    'lastVideoUpload' => count($videos) > 0 ? end($videos)['title'] : null,
    'lastMusicUpload' => count($music) > 0 ? end($music)['title'] : null,
]);
