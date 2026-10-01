<?php
/**
 * ASR Water & Drainage - Administrator Authentication API
 * Implements password_verify() with Bcrypt hashing and session token generation.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("SELECT id, name, email, password_hash, role, active 
                           FROM administrators 
                           WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    if (!$admin['active']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'This administrator account is deactivated.']);
        exit;
    }

    // Update last login timestamp
    $pdo->prepare("UPDATE administrators SET last_login_at = NOW() WHERE id = :id")->execute([':id' => $admin['id']]);

    // Create session token
    $token = bin2hex(random_bytes(32));

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token'   => $token,
        'user'    => [
            'id'    => $admin['id'],
            'name'  => $admin['name'],
            'email' => $admin['email'],
            'role'  => $admin['role']
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
