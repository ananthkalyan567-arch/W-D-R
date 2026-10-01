<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - CSRF Protection Middleware
 */

require_once __DIR__ . '/../helpers/response.php';

class CsrfMiddleware {
    public static function generateToken(): string {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function handle(): void {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }

        // Bearer-token authenticated REST requests are inherently immune to browser CSRF.
        // If Bearer token is provided, bypass session CSRF check.
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return;
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['_csrf_token'] ?? null);

        if (!$token || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
            jsonError("CSRF token verification failed.", "CSRF_TOKEN_INVALID", 403);
        }
    }
}
