<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - ComplaintUpdate Model (Timeline Tracking)
 */

require_once __DIR__ . '/../config/database.php';

class ComplaintUpdate {
    public static function create(
        int $complaintId,
        ?int $userId,
        ?string $oldStatus,
        string $newStatus,
        string $message,
        bool $isPublic = true
    ): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO complaint_updates 
            (complaint_id, user_id, old_status, new_status, message, is_public) 
            VALUES (:complaint_id, :user_id, :old_status, :new_status, :message, :is_public)");
        
        $stmt->execute([
            ':complaint_id' => $complaintId,
            ':user_id'      => $userId,
            ':old_status'   => $oldStatus,
            ':new_status'   => $newStatus,
            ':message'      => $message,
            ':is_public'    => $isPublic ? 1 : 0
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function getByComplaintId(int $complaintId, bool $publicOnly = false): array {
        $pdo = Database::getConnection();
        $sql = "SELECT cu.*, u.name as updated_by_name, u.role as updated_by_role 
                FROM complaint_updates cu 
                LEFT JOIN users u ON cu.user_id = u.id 
                WHERE cu.complaint_id = :comp_id";

        if ($publicOnly) {
            $sql .= " AND cu.is_public = 1";
        }

        $sql .= " ORDER BY cu.created_at ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([':comp_id' => $complaintId]);
        return $stmt->fetchAll();
    }
}
