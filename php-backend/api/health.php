<?php
require __DIR__ . '/_bootstrap.php';
require_method('GET');

$videos = read_json(VIDEOS_JSON);
$music  = read_json(MUSIC_JSON);

send_json([
    'status'  => 'ok',
    'message' => 'PHP upload server ishlamoqda',
    'stats'   => [
        'videos' => count($videos),
        'music'  => count($music),
    ],
    'php'     => PHP_VERSION,
]);
