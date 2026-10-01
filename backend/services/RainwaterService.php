<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Rainwater Service
 * Handles rainwater observation ingestion, automatic linked problem generation (ASR-RW-XXXXXX),
 * administrative verification, and organization assignment.
 */

require_once __DIR__ . '/../models/RainwaterReport.php';
require_once __DIR__ . '/../models/Complaint.php';
require_once __DIR__ . '/../models/ComplaintUpdate.php';
require_once __DIR__ . '/../models/Assignment.php';
require_once __DIR__ . '/../models/Notification.php';
require_once __DIR__ . '/../models/AuditLog.php';
require_once __DIR__ . '/../models/Location.php';
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/ComplaintService.php';

class RainwaterService {
    // Valid Report Types
    public static array $reportTypes = [
        'opening_available'             => 'Rainwater Opening Available',
        'opening_not_available'         => 'Rainwater Drip/Drainage Opening Not Available',
        'opening_blocked'               => 'Rainwater Opening Blocked',
        'opening_damaged'               => 'Rainwater Opening Damaged',
        'rainwater_overflow'            => 'Rainwater Overflow',
        'waterlogging'                  => 'Waterlogging',
        'rainwater_path_blocked'        => 'Rainwater Path Blocked',
        'collection_problem'            => 'Rainwater Collection Problem',
        'drainage_connection_problem'   => 'Drainage Connection Problem',
        'other'                         => 'Other Rainwater Issue'
    ];

    /**
     * Submit Rainwater Report
     * Handles YES (Available), NO (Not Available), and NOT SURE workflows.
     * Automatically links a complaint if not available or blocked/damaged or raise_problem requested.
     */
    public static function submitReport(array $data, ?int $userId = null): array {
        $pdo = Database::getConnection();
        $pdo->beginTransaction();

        try {
            $locationId = (int)($data['location_id'] ?? 0);
            if ($locationId <= 0) {
                throw new InvalidArgumentException("A valid location must be selected.");
            }

            $availabilityStatus = $data['availability_status'] ?? 'unknown';
            if (!in_array($availabilityStatus, ['available', 'not_available', 'unknown'])) {
                $availabilityStatus = 'unknown';
            }

            $conditionStatus = $data['condition_status'] ?? 'unknown';
            if (!in_array($conditionStatus, ['good', 'partially_blocked', 'blocked', 'damaged', 'unknown'])) {
                $conditionStatus = 'unknown';
            }

            // Determine if a complaint should be generated
            $raiseProblem = !empty($data['raise_problem']) && ($data['raise_problem'] === true || $data['raise_problem'] === 'true' || $data['raise_problem'] === '1');
            $isNotAvailable = ($availabilityStatus === 'not_available');
            $isProblemCondition = in_array($conditionStatus, ['blocked', 'damaged', 'partially_blocked']);

            $shouldRaiseComplaint = $raiseProblem || $isNotAvailable || $isProblemCondition;

            // Determine report_type
            $reportType = $data['report_type'] ?? null;
            if (!$reportType) {
                if ($isNotAvailable) {
                    $reportType = 'opening_not_available';
                } elseif ($conditionStatus === 'blocked') {
                    $reportType = 'opening_blocked';
                } elseif ($conditionStatus === 'damaged') {
                    $reportType = 'opening_damaged';
                } elseif ($availabilityStatus === 'available') {
                    $reportType = 'opening_available';
                } else {
                    $reportType = 'other';
                }
            }

            $complaintId = null;
            $complaintNumber = null;

            if ($shouldRaiseComplaint) {
                // Determine category for complaint
                $categoryName = self::$reportTypes[$reportType] ?? 'Rainwater Drip/Drainage Opening Not Available';
                
                // Lookup or default category id from categories table
                $catStmt = $pdo->prepare("SELECT id FROM categories WHERE type = 'rainwater' AND name LIKE :q LIMIT 1");
                $catStmt->execute([':q' => '%' . substr($categoryName, 0, 15) . '%']);
                $catId = $catStmt->fetchColumn();

                if (!$catId) {
                    // Fallback to first active rainwater category or general category
                    $fallbackStmt = $pdo->query("SELECT id FROM categories WHERE type = 'rainwater' LIMIT 1");
                    $catId = $fallbackStmt->fetchColumn() ?: 15;
                }

                // Generate complaint title
                $title = !empty($data['title']) ? $data['title'] : "Rainwater Issue: " . $categoryName;
                $description = !empty($data['description']) ? $data['description'] : ($isNotAvailable ? "Rainwater drip/drainage opening is not available at this location." : "Rainwater drainage condition reported as {$conditionStatus}.");

                // Generate complaint with prefix 'ASR-RW'
                $stmtCount = $pdo->query("SELECT COUNT(*) FROM complaints WHERE complaint_number LIKE 'ASR-RW-%'");
                $rwCount = ((int)$stmtCount->fetchColumn()) + 1;
                $complaintNumber = sprintf("ASR-RW-%06d", $rwCount);

                $insertComp = $pdo->prepare("INSERT INTO complaints 
                    (complaint_number, user_id, location_id, category_id, title, description, landmark, 
                     latitude, longitude, photo_path, citizen_severity, system_priority, status)
                    VALUES 
                    (:num, :user_id, :loc_id, :cat_id, :title, :desc, :landmark, 
                     :lat, :lng, :photo, :severity, :priority, 'submitted')");

                $severity = $data['citizen_severity'] ?? ($isNotAvailable || in_array($conditionStatus, ['blocked', 'damaged']) ? 'high' : 'medium');

                $insertComp->execute([
                    ':num'       => $complaintNumber,
                    ':user_id'   => $userId,
                    ':loc_id'    => $locationId,
                    ':cat_id'    => (int)$catId,
                    ':title'     => $title,
                    ':desc'      => $description,
                    ':landmark'  => $data['landmark'] ?? null,
                    ':lat'       => !empty($data['latitude']) ? (float)$data['latitude'] : null,
                    ':lng'       => !empty($data['longitude']) ? (float)$data['longitude'] : null,
                    ':photo'     => $data['photo_path'] ?? null,
                    ':severity'  => $severity,
                    ':priority'  => $severity
                ]);

                $complaintId = (int)$pdo->lastInsertId();

                // Add timeline entry for complaint
                ComplaintUpdate::create(
                    $complaintId,
                    $userId,
                    null,
                    'submitted',
                    "Rainwater report registered ({$categoryName}). Generated tracking ID: {$complaintNumber}.",
                    true
                );

                if ($userId) {
                    Notification::create(
                        $userId,
                        $complaintId,
                        'COMPLAINT_SUBMITTED',
                        'Rainwater Problem Registered',
                        "Your rainwater complaint #{$complaintNumber} has been logged and queued for administrative verification.",
                        'in_app'
                    );
                }
            }

            // Create Rainwater Report entry
            $reportNumber = RainwaterReport::generateReportNumber();
            $reportId = RainwaterReport::create([
                'report_number'        => $reportNumber,
                'complaint_id'         => $complaintId,
                'user_id'              => $userId,
                'location_id'          => $locationId,
                'report_type'          => $reportType,
                'availability_status'  => $availabilityStatus,
                'condition_status'     => $conditionStatus,
                'verification_status'  => 'pending',
                'description'          => $data['description'] ?? null,
                'landmark'             => $data['landmark'] ?? null,
                'latitude'             => !empty($data['latitude']) ? (float)$data['latitude'] : null,
                'longitude'            => !empty($data['longitude']) ? (float)$data['longitude'] : null,
                'photo_path'           => $data['photo_path'] ?? null,
                'video_path'           => $data['video_path'] ?? null,
                'citizen_severity'     => $data['citizen_severity'] ?? 'medium',
                'admin_priority'      => $data['admin_priority'] ?? ($data['citizen_severity'] ?? 'medium')
            ]);

            // Audit log
            AuditLog::create(
                $userId,
                'RAINWATER_REPORT_CREATED',
                'rainwater_report',
                $reportId,
                null,
                [
                    'report_number' => $reportNumber,
                    'availability'  => $availabilityStatus,
                    'condition'     => $conditionStatus,
                    'complaint_id'  => $complaintId,
                    'complaint_no'  => $complaintNumber
                ]
            );

            $pdo->commit();

            $fullReport = RainwaterReport::findById($reportId);
            return [
                'report'           => $fullReport,
                'complaint_id'     => $complaintId,
                'complaint_number' => $complaintNumber
            ];

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Admin Verification of Rainwater Report
     * Options: pending, verified, not_verified, rejected
     */
    public static function verifyReport(int $reportId, string $verificationStatus, int $adminId, ?string $notes = null): array {
        $allowed = ['pending', 'verified', 'not_verified', 'rejected'];
        if (!in_array($verificationStatus, $allowed)) {
            throw new InvalidArgumentException("Invalid verification status. Allowed: " . implode(', ', $allowed));
        }

        $report = RainwaterReport::findById($reportId);
        if (!$report) {
            throw new RuntimeException("Rainwater report not found.");
        }

        $oldVerification = $report['verification_status'];
        RainwaterReport::verify($reportId, $verificationStatus, $adminId, $notes);

        // If report has linked complaint, update complaint workflow accordingly
        if (!empty($report['complaint_id'])) {
            $complaintId = (int)$report['complaint_id'];
            if ($verificationStatus === 'verified') {
                ComplaintUpdate::create(
                    $complaintId,
                    $adminId,
                    $report['complaint_status'],
                    'under_review',
                    "Rainwater report verified on site by inspection authority: " . ($notes ?? 'Infrastructure condition confirmed.'),
                    true
                );
            } elseif ($verificationStatus === 'rejected') {
                ComplaintService::rejectComplaint($complaintId, $adminId, $notes ?? 'Rainwater report rejected after preliminary check.');
            }
        }

        AuditLog::create(
            $adminId,
            'RAINWATER_REPORT_VERIFIED',
            'rainwater_report',
            $reportId,
            ['verification_status' => $oldVerification],
            ['verification_status' => $verificationStatus, 'notes' => $notes]
        );

        return RainwaterReport::findById($reportId);
    }

    /**
     * Assign Linked Rainwater Complaint to Organization / Staff
     */
    public static function assignReport(int $reportId, int $organizationId, ?int $assignedUserId, int $adminId, ?string $notes = null): array {
        $report = RainwaterReport::findById($reportId);
        if (!$report) {
            throw new RuntimeException("Rainwater report not found.");
        }

        if (empty($report['complaint_id'])) {
            throw new RuntimeException("This rainwater report does not have a linked complaint to assign.");
        }

        $complaintId = (int)$report['complaint_id'];
        $complaint = ComplaintService::assign($complaintId, $organizationId, $assignedUserId, $adminId, $notes);

        AuditLog::create(
            $adminId,
            'RAINWATER_REPORT_ASSIGNED',
            'rainwater_report',
            $reportId,
            null,
            ['organization_id' => $organizationId, 'assigned_user_id' => $assignedUserId, 'notes' => $notes]
        );

        return RainwaterReport::findById($reportId);
    }
}
