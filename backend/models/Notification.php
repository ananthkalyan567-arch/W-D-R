<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Notification Model
 */

require_once __DIR__ . '/../config/database.php';

class Notification {
    public static function create(
        int $userId,
        ?int $complaintId,
        string $type,
        string $title,
        string $message,
        string $channel = 'in_app'
    ): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO notifications 
            (user_id, complaint_id, type, title, message, channel, status) 
            VALUES (:user_id, :comp_id, :type, :title, :message, :channel, 'sent')");
        
        $stmt->execute([
            ':user_id' => $userId,
            ':comp_id' => $complaintId,
            ':type'    => $type,
            ':title'   => $title,
            ':message' => $message,
            ':channel' => $channel
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function getByUser(int $userId, int $limit = 30): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT :limit");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function markAsRead(int $id, int $userId): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE notifications SET status = 'read' WHERE id = :id AND user_id = :user_id");
        return $stmt->execute([':id' => $id, ':user_id' => $userId]);
    }
}
