<?php
// ============================================================================
// /api/auth.php — verify admin login + password.
// Front-end POSTs { username, password } as JSON or form-encoded.
// Returns 200 { success: true } on match, 401 { error } otherwise.
// ============================================================================
require __DIR__ . '/_bootstrap.php';
require_method('POST');

$body     = read_json_body();
$username = (string)($body['username'] ?? $_POST['username'] ?? '');
$password = (string)($body['password'] ?? $_POST['password'] ?? '');

// Evaluate both checks before branching so the response time doesn't
// leak which field was wrong.
$userOk = hash_equals(ADMIN_USERNAME, $username);
$passOk = hash_equals(ADMIN_PASSWORD, $password);
if (!$userOk || !$passOk) {
    send_error("Login yoki parol noto'g'ri", 401);
}

send_json(['success' => true]);
