<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Authentication Middleware
 * Enforces valid bearer token or session credentials.
 */

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../helpers/response.php';

class AuthMiddleware {
    public static function handle(): array {
        $token = self::extractBearerToken();

        if (!$token) {
            jsonError("Authentication token is missing. Please sign in.", "UNAUTHORIZED", 401);
        }

        $payload = AuthService::validateToken($token);

        if (!$payload) {
            jsonError("Authentication token has expired or is invalid. Please sign in again.", "TOKEN_INVALID", 401);
        }

        $user = User::findById((int)$payload['sub']);

        if (!$user || $user['status'] !== 'active') {
            jsonError("User account is inactive or not found.", "USER_INACTIVE", 403);
        }

        return $user;
    }

    public static function optional(): ?array {
        $token = self::extractBearerToken();
        if (!$token) return null;

        $payload = AuthService::validateToken($token);
        if (!$payload) return null;

        return User::findById((int)$payload['sub']);
    }

    private static function extractBearerToken(): ?string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return trim($matches[1]);
        }

        // Fallback to cookie if present
        if (!empty($_COOKIE['asr_auth_token'])) {
            return trim($_COOKIE['asr_auth_token']);
        }

        return null;
    }
}
