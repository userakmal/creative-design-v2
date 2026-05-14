<?php
require __DIR__ . '/_bootstrap.php';
require_method('GET');

$videos = read_json(VIDEOS_JSON);
$music  = read_json(MUSIC_JSON);

$totalSize = 0;
$countDir = function (string $dir) use (&$totalSize): int {
    if (!is_dir($dir)) return 0;
    $count = 0;
    foreach (scandir($dir) ?: [] as $f) {
        if ($f === '.' || $f === '..') continue;
        $full = $dir . '/' . $f;
        if (is_file($full)) {
            $totalSize += filesize($full) ?: 0;
            $count++;
        }
    }
    return $count;
};

$videoFiles = $countDir(VIDEO_DIR);
$imageFiles = $countDir(IMAGE_DIR);
$musicFiles = $countDir(MUSIC_DIR);

send_json([
    'videos' => count($videos),
    'music'  => count($music),
    'files'  => [
        'videos' => $videoFiles,
        'images' => $imageFiles,
        'music'  => $musicFiles,
    ],
    'diskUsage'       => format_size($totalSize),
    'lastVideoUpload' => !empty($videos) ? end($videos)['title'] : null,
    'lastMusicUpload' => !empty($music)  ? end($music)['title']  : null,
]);
