<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - NotificationController
 */

require_once __DIR__ . '/../models/Notification.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/response.php';

class NotificationController {
    public function index(): void {
        $user = AuthMiddleware::handle();
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

        $notifications = Notification::getByUser((int)$user['id'], $limit);
        jsonSuccess("Notifications retrieved.", $notifications);
    }

    public function markRead(int $id): void {
        $user = AuthMiddleware::handle();
        Notification::markAsRead($id, (int)$user['id']);
        jsonSuccess("Notification marked as read.");
    }
}
