<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Complaint Lifecycle Service
 * Enforces transactional integrity, status machine transitions, and audit records.
 */

require_once __DIR__ . '/../models/Complaint.php';
require_once __DIR__ . '/../models/ComplaintUpdate.php';
require_once __DIR__ . '/../models/Assignment.php';
require_once __DIR__ . '/../models/Notification.php';
require_once __DIR__ . '/../models/AuditLog.php';
require_once __DIR__ . '/../models/Location.php';
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../models/Organization.php';

class ComplaintService {
    // Valid Workflow Transitions
    private static array $allowedTransitions = [
        'submitted'    => ['under_review', 'assigned', 'in_progress', 'rejected', 'duplicate'],
        'under_review' => ['assigned', 'in_progress', 'rejected', 'duplicate'],
        'assigned'     => ['in_progress', 'under_review', 'rejected', 'duplicate'],
        'in_progress'  => ['resolved', 'under_review', 'assigned'],
        'resolved'     => ['closed', 'in_progress'],
        'rejected'     => ['under_review'],
        'duplicate'    => ['under_review'],
        'closed'       => []
    ];

    public static function createComplaint(array $data, ?int $userId = null): array {
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $data['user_id'] = $userId;
            $complaintId = Complaint::create($data);
            $complaint = Complaint::findById($complaintId);

            // Record initial timeline audit
            ComplaintUpdate::create(
                $complaintId,
                $userId,
                null,
                'submitted',
                'Complaint registered successfully and queued for review.',
                true
            );

            // Create notification if registered citizen
            if ($userId) {
                Notification::create(
                    $userId,
                    $complaintId,
                    'COMPLAINT_SUBMITTED',
                    'Complaint Registered',
                    "Your report #{$complaint['complaint_number']} has been filed successfully. You can track updates at any time.",
                    'in_app'
                );
            }

            AuditLog::log($userId, 'COMPLAINT_CREATED', 'complaints', $complaintId, null, [
                'complaint_number' => $complaint['complaint_number'],
                'category_id'      => $data['category_id'],
                'location_id'      => $data['location_id']
            ]);

            $pdo->commit();
            return $complaint;
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function updateStatus(
        int $complaintId,
        string $newStatus,
        int $adminUserId,
        ?string $message = null,
        bool $isPublic = true
    ): array {
        $complaint = Complaint::findById($complaintId);
        if (!$complaint) {
            throw new RuntimeException("Complaint not found.");
        }

        $currentStatus = $complaint['status'];
        if ($currentStatus === $newStatus) {
            return $complaint;
        }

        // Validate state machine transition
        $validTargets = self::$allowedTransitions[$currentStatus] ?? [];
        if (!in_array($newStatus, $validTargets, true)) {
            throw new InvalidArgumentException("Illegal status transition from '{$currentStatus}' to '{$newStatus}'.");
        }

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            Complaint::updateStatus($complaintId, $newStatus);

            $updateMessage = $message ?? "Status changed from {$currentStatus} to {$newStatus} by authorized administrator.";

            ComplaintUpdate::create(
                $complaintId,
                $adminUserId,
                $currentStatus,
                $newStatus,
                $updateMessage,
                $isPublic
            );

            // Notify citizen if user exists
            if (!empty($complaint['user_id'])) {
                Notification::create(
                    (int)$complaint['user_id'],
                    $complaintId,
                    'STATUS_UPDATED',
                    "Status Update: {$complaint['complaint_number']}",
                    "Your complaint status is now '{$newStatus}'.",
                    'in_app'
                );
            }

            AuditLog::log($adminUserId, 'STATUS_UPDATED', 'complaints', $complaintId, ['status' => $currentStatus], ['status' => $newStatus, 'message' => $updateMessage]);

            $pdo->commit();
            return Complaint::findById($complaintId);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function assignComplaint(
        int $complaintId,
        int $organizationId,
        ?int $assignedUserId,
        int $assignedByAdminId,
        ?string $notes = null
    ): array {
        $complaint = Complaint::findById($complaintId);
        if (!$complaint) {
            throw new RuntimeException("Complaint not found.");
        }

        $org = Organization::findById($organizationId);
        if (!$org || $org['status'] !== 'active') {
            throw new InvalidArgumentException("Selected organization is invalid or inactive.");
        }

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            // Update complaint assignment and advance status to 'assigned' or 'in_progress'
            $nextStatus = in_array($complaint['status'], ['submitted', 'under_review'], true) ? 'assigned' : $complaint['status'];

            $stmt = $pdo->prepare("UPDATE complaints SET assigned_organization_id = :org_id, assigned_user_id = :user_id, status = :status WHERE id = :id");
            $stmt->execute([
                ':org_id'  => $organizationId,
                ':user_id' => $assignedUserId,
                ':status'  => $nextStatus,
                ':id'      => $complaintId
            ]);

            Assignment::create($complaintId, $organizationId, $assignedUserId, $assignedByAdminId, $notes);

            $msg = "Complaint assigned to organization '{$org['name']}'." . ($notes ? " Note: {$notes}" : "");
            ComplaintUpdate::create(
                $complaintId,
                $assignedByAdminId,
                $complaint['status'],
                $nextStatus,
                $msg,
                true
            );

            AuditLog::log($assignedByAdminId, 'COMPLAINT_ASSIGNED', 'complaints', $complaintId, null, [
                'organization_id' => $organizationId,
                'organization'    => $org['name']
            ]);

            $pdo->commit();
            return Complaint::findById($complaintId);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function resolveComplaint(
        int $complaintId,
        string $resolutionNotes,
        ?string $photoPath,
        int $adminUserId
    ): array {
        if (empty(trim($resolutionNotes))) {
            throw new InvalidArgumentException("Resolution notes explaining the physical repair or de-silting action are required.");
        }

        $complaint = Complaint::findById($complaintId);
        if (!$complaint) {
            throw new RuntimeException("Complaint not found.");
        }

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("UPDATE complaints SET 
                status = 'resolved', 
                resolution_notes = :notes, 
                resolved_at = NOW() 
                WHERE id = :id");
            $stmt->execute([':notes' => $resolutionNotes, ':id' => $complaintId]);

            ComplaintUpdate::create(
                $complaintId,
                $adminUserId,
                $complaint['status'],
                'resolved',
                "Resolution officially verified and recorded by administrator: {$resolutionNotes}",
                true
            );

            if (!empty($complaint['user_id'])) {
                Notification::create(
                    (int)$complaint['user_id'],
                    $complaintId,
                    'COMPLAINT_RESOLVED',
                    'Complaint Marked Resolved',
                    "Your report #{$complaint['complaint_number']} has been resolved by maintenance teams.",
                    'in_app'
                );
            }

            AuditLog::log($adminUserId, 'COMPLAINT_RESOLVED', 'complaints', $complaintId, null, ['notes' => $resolutionNotes]);

            $pdo->commit();
            return Complaint::findById($complaintId);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function rejectComplaint(int $complaintId, string $reason, int $adminUserId): array {
        if (empty(trim($reason))) {
            throw new InvalidArgumentException("A clear reason for rejecting the complaint is required.");
        }

        $complaint = Complaint::findById($complaintId);
        if (!$complaint) {
            throw new RuntimeException("Complaint not found.");
        }

        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("UPDATE complaints SET status = 'rejected', rejection_reason = :reason WHERE id = :id");
            $stmt->execute([':reason' => $reason, ':id' => $complaintId]);

            ComplaintUpdate::create(
                $complaintId,
                $adminUserId,
                $complaint['status'],
                'rejected',
                "Complaint rejected: {$reason}",
                true
            );

            AuditLog::log($adminUserId, 'COMPLAINT_REJECTED', 'complaints', $complaintId, null, ['reason' => $reason]);

            $pdo->commit();
            return Complaint::findById($complaintId);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
