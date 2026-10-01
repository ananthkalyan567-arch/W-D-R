<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Organization Authorization Middleware
 * Enforces organization boundary isolation.
 */

require_once __DIR__ . '/AuthMiddleware.php';
require_once __DIR__ . '/../models/Organization.php';
require_once __DIR__ . '/../helpers/response.php';

class OrganizationMiddleware {
    public static function handle(): array {
        $user = AuthMiddleware::handle();

        // Super admins and district admins have overarching access
        if (in_array($user['role'], ['admin', 'super_admin'], true)) {
            return ['user' => $user, 'org_id' => null];
        }

        if ($user['role'] !== 'organization_admin') {
            jsonError("Access denied. Organization privileges required.", "FORBIDDEN", 403);
        }

        // Retrieve user's linked organization
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT organization_id FROM organization_users WHERE user_id = :uid LIMIT 1");
        $stmt->execute([':uid' => $user['id']]);
        $orgId = $stmt->fetchColumn();

        if (!$orgId) {
            jsonError("Your account is not assigned to an active organization entity.", "NO_ORG_ASSIGNED", 403);
        }

        return ['user' => $user, 'org_id' => (int)$orgId];
    }
}
