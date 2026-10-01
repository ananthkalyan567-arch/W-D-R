<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Assignment Model
 */

require_once __DIR__ . '/../config/database.php';

class Assignment {
    public static function create(
        int $complaintId,
        int $organizationId,
        ?int $assignedUserId,
        int $assignedBy,
        ?string $notes = null
    ): int {
        $pdo = Database::getConnection();
        
        // Mark any previous active assignment as reassigned
        $prevStmt = $pdo->prepare("UPDATE assignments SET status = 'reassigned', unassigned_at = NOW() 
                                   WHERE complaint_id = :comp_id AND status = 'active'");
        $prevStmt->execute([':comp_id' => $complaintId]);

        $stmt = $pdo->prepare("INSERT INTO assignments 
            (complaint_id, organization_id, assigned_user_id, assigned_by, notes, status) 
            VALUES (:comp_id, :org_id, :user_id, :assigned_by, :notes, 'active')");
        
        $stmt->execute([
            ':comp_id'     => $complaintId,
            ':org_id'      => $organizationId,
            ':user_id'     => $assignedUserId,
            ':assigned_by' => $assignedBy,
            ':notes'       => $notes
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function getByComplaintId(int $complaintId): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT a.*, o.name as organization_name, u.name as assigned_user_name, by_u.name as assigned_by_name 
                               FROM assignments a 
                               JOIN organizations o ON a.organization_id = o.id 
                               LEFT JOIN users u ON a.assigned_user_id = u.id 
                               JOIN users by_u ON a.assigned_by = by_u.id 
                               WHERE a.complaint_id = :comp_id 
                               ORDER BY a.assigned_at DESC");
        $stmt->execute([':comp_id' => $complaintId]);
        return $stmt->fetchAll();
    }
}
