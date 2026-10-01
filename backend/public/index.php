<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Public Front Controller (Entry Point)
 * 
 * Handles incoming HTTP requests, enforces security headers, manages CORS,
 * routes API calls to the central router, and ensures safe JSON responses.
 */

// 1. Error Reporting Configuration (Strict error suppression in output to prevent leaking credentials/paths)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// 2. Load Environment Variables
require_once __DIR__ . '/../config/environment.php';
Environment::load(__DIR__ . '/../.env');

// 3. Helpers & Security
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/logger.php';
require_once __DIR__ . '/../helpers/security.php';

// 4. Global Security Headers
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");

// 5. CORS (Cross-Origin Resource Sharing) Headers
$allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:8080'
];

$httpOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($httpOrigin, $allowedOrigins, true) || env('APP_ENV') === 'development') {
    header("Access-Control-Allow-Origin: " . ($httpOrigin ?: '*'));
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 6. Safe Static Asset Delivery for Uploaded Evidence Photos
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (preg_match('#^/uploads/([a-zA-Z0-9_\-\.]+\.(jpe?g|png|webp|gif))$#i', $uri, $matches)) {
    $filename = basename($matches[1]);
    $filePath = __DIR__ . '/../uploads/' . $filename;

    if (file_exists($filePath) && is_readable($filePath)) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (in_array($mime, $allowedMimes, true)) {
            header("Content-Type: " . $mime);
            header("Content-Length: " . filesize($filePath));
            header("Cache-Control: public, max-age=86400");
            readfile($filePath);
            exit;
        }
    }

    header("Content-Type: application/json; charset=UTF-8");
    jsonError("Uploaded photo not found or invalid.", "FILE_NOT_FOUND", 404);
}

// Ensure default Content-Type for API JSON responses
header("Content-Type: application/json; charset=UTF-8");

// 7. Route and Dispatch Request
try {
    /** @var Router $router */
    $router = require_once __DIR__ . '/../routes/api.php';
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (Throwable $e) {
    Logger::error("Unhandled Exception: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());
    
    // In development mode, provide safe message; in production never leak stack traces
    $isDev = env('APP_ENV', 'development') === 'development';
    $message = $isDev ? $e->getMessage() : "An unexpected internal server error occurred.";
    
    jsonError($message, "INTERNAL_SERVER_ERROR", 500);
}
