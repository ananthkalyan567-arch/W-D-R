<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - UserController (Admin User Management)
 */

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/AuditLog.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/response.php';

class UserController {
    public function index(): void {
        AdminMiddleware::handle();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

        $filters = [
            'role'   => $_GET['role'] ?? null,
            'status' => $_GET['status'] ?? null,
            'search' => $_GET['search'] ?? null
        ];

        $result = User::getAll($filters, $page, $limit);
        jsonSuccess("Users retrieved.", $result['users'], 200, [
            'page'        => $result['page'],
            'limit'       => $result['limit'],
            'total'       => $result['total'],
            'total_pages' => (int)ceil($result['total'] / $limit)
        ]);
    }

    public function show(int $id): void {
        AdminMiddleware::handle();

        $user = User::findById($id);
        if (!$user) {
            jsonError("User not found.", "USER_NOT_FOUND", 404);
        }

        jsonSuccess("User profile retrieved.", $user);
    }

    public function update(int $id): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        // Privilege escalation guard: Ordinary admin cannot promote anyone to super_admin
        if (isset($input['role']) && $input['role'] === 'super_admin' && $admin['role'] !== 'super_admin') {
            jsonError("Only Super Administrators can assign the super_admin role.", "FORBIDDEN", 403);
        }

        $current = User::findById($id);
        if (!$current) {
            jsonError("User not found.", "USER_NOT_FOUND", 404);
        }

        User::update($id, $input);
        AuditLog::log((int)$admin['id'], 'USER_UPDATED', 'users', $id, $current, $input);

        jsonSuccess("User updated successfully.", User::findById($id));
    }

    public function suspend(int $id): void {
        $admin = AdminMiddleware::handle();

        $target = User::findById($id);
        if (!$target) {
            jsonError("User not found.", "USER_NOT_FOUND", 404);
        }

        // Prevent self suspension
        if ((int)$admin['id'] === $id) {
            jsonError("Administrators cannot suspend their own active account.", "INVALID_ACTION", 400);
        }

        User::update($id, ['status' => 'suspended']);
        AuditLog::log((int)$admin['id'], 'USER_SUSPENDED', 'users', $id);

        jsonSuccess("User account has been suspended.");
    }

    public function activate(int $id): void {
        $admin = AdminMiddleware::handle();

        User::update($id, ['status' => 'active']);
        AuditLog::log((int)$admin['id'], 'USER_ACTIVATED', 'users', $id);

        jsonSuccess("User account has been activated.");
    }
}
