<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'ok',
    'php_version' => phpversion(),
    'server' => php_sapi_name(),
    'cwd' => getcwd(),
    'data_dir_exists' => is_dir('../data'),
    'videos_json_exists' => file_exists('../data/videos.json'),
]);
