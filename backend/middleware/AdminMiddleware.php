<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Administrator Authorization Middleware
 * Enforces admin or super_admin privileges. Never trusts client-sent role.
 */

require_once __DIR__ . '/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/response.php';

class AdminMiddleware {
    public static function handle(): array {
        $user = AuthMiddleware::handle();

        if (!in_array($user['role'], ['admin', 'super_admin'], true)) {
            jsonError("Access denied. Administrator privileges are required to perform this action.", "FORBIDDEN", 403);
        }

        return $user;
    }

    public static function handleSuperAdmin(): array {
        $user = AuthMiddleware::handle();

        if ($user['role'] !== 'super_admin') {
            jsonError("Access denied. Super Administrator privileges are required.", "FORBIDDEN", 403);
        }

        return $user;
    }
}
