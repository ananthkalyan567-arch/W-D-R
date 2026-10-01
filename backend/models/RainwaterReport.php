<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Rainwater Report Model
 * Manages rainwater drip/drainage opening infrastructure observations and problem links.
 */

require_once __DIR__ . '/../config/database.php';

class RainwaterReport {
    public static function generateReportNumber(): string {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT MAX(id) FROM rainwater_reports");
        $nextId = ((int)$stmt->fetchColumn()) + 1;
        return sprintf("ASR-RW-REP-%06d", $nextId);
    }

    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $number = !empty($data['report_number']) ? $data['report_number'] : self::generateReportNumber();

        $stmt = $pdo->prepare("INSERT INTO rainwater_reports 
            (report_number, complaint_id, user_id, location_id, report_type, availability_status, 
             condition_status, verification_status, description, landmark, latitude, longitude, 
             photo_path, video_path, citizen_severity, admin_priority)
            VALUES 
            (:report_number, :complaint_id, :user_id, :location_id, :report_type, :availability_status, 
             :condition_status, :verification_status, :description, :landmark, :latitude, :longitude, 
             :photo_path, :video_path, :citizen_severity, :admin_priority)");

        $stmt->execute([
            ':report_number'        => $number,
            ':complaint_id'         => !empty($data['complaint_id']) ? (int)$data['complaint_id'] : null,
            ':user_id'              => !empty($data['user_id']) ? (int)$data['user_id'] : null,
            ':location_id'          => (int)$data['location_id'],
            ':report_type'          => $data['report_type'] ?? 'opening_not_available',
            ':availability_status'  => $data['availability_status'] ?? 'unknown',
            ':condition_status'     => $data['condition_status'] ?? 'unknown',
            ':verification_status'  => $data['verification_status'] ?? 'pending',
            ':description'          => $data['description'] ?? null,
            ':landmark'             => $data['landmark'] ?? null,
            ':latitude'             => !empty($data['latitude']) ? (float)$data['latitude'] : null,
            ':longitude'            => !empty($data['longitude']) ? (float)$data['longitude'] : null,
            ':photo_path'           => $data['photo_path'] ?? null,
            ':video_path'           => $data['video_path'] ?? null,
            ':citizen_severity'     => $data['citizen_severity'] ?? 'medium',
            ':admin_priority'      => $data['admin_priority'] ?? 'medium'
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function findById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT r.*, 
                                      l.name as location_name, l.name_te as location_name_te, l.location_type,
                                      parent_l.name as parent_location_name,
                                      u.name as citizen_name, u.phone as citizen_phone, u.email as citizen_email,
                                      v.name as verified_by_name,
                                      c.complaint_number, c.status as complaint_status, c.system_priority,
                                      c.assigned_organization_id, org.name as assigned_organization_name
                               FROM rainwater_reports r
                               LEFT JOIN locations l ON r.location_id = l.id
                               LEFT JOIN locations parent_l ON l.parent_id = parent_l.id
                               LEFT JOIN users u ON r.user_id = u.id
                               LEFT JOIN users v ON r.verified_by = v.id
                               LEFT JOIN complaints c ON r.complaint_id = c.id
                               LEFT JOIN organizations org ON c.assigned_organization_id = org.id
                               WHERE r.id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findByReportNumber(string $reportNumber): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT r.*, 
                                      l.name as location_name, l.name_te as location_name_te,
                                      c.complaint_number, c.status as complaint_status
                               FROM rainwater_reports r
                               LEFT JOIN locations l ON r.location_id = l.id
                               LEFT JOIN complaints c ON r.complaint_id = c.id
                               WHERE r.report_number = :number LIMIT 1");
        $stmt->execute([':number' => strtoupper(trim($reportNumber))]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function getAll(array $filters = [], int $page = 1, int $limit = 20): array {
        $pdo = Database::getConnection();
        $offset = ($page - 1) * $limit;

        $where = ["1=1"];
        $params = [];

        if (!empty($filters['availability_status'])) {
            $where[] = "r.availability_status = :availability_status";
            $params[':availability_status'] = $filters['availability_status'];
        }

        if (!empty($filters['condition_status'])) {
            $where[] = "r.condition_status = :condition_status";
            $params[':condition_status'] = $filters['condition_status'];
        }

        if (!empty($filters['verification_status'])) {
            $where[] = "r.verification_status = :verification_status";
            $params[':verification_status'] = $filters['verification_status'];
        }

        if (!empty($filters['report_type'])) {
            $where[] = "r.report_type = :report_type";
            $params[':report_type'] = $filters['report_type'];
        }

        if (!empty($filters['location_id'])) {
            $where[] = "(r.location_id = :location_id OR l.parent_id = :parent_id)";
            $params[':location_id'] = (int)$filters['location_id'];
            $params[':parent_id']   = (int)$filters['location_id'];
        }

        if (!empty($filters['user_id'])) {
            $where[] = "r.user_id = :user_id";
            $params[':user_id'] = (int)$filters['user_id'];
        }

        if (!empty($filters['has_complaint'])) {
            if ($filters['has_complaint'] === 'yes' || $filters['has_complaint'] === 'true' || $filters['has_complaint'] === true) {
                $where[] = "r.complaint_id IS NOT NULL";
            } else {
                $where[] = "r.complaint_id IS NULL";
            }
        }

        if (!empty($filters['search'])) {
            $where[] = "(r.report_number LIKE :search OR r.landmark LIKE :search OR r.description LIKE :search OR c.complaint_number LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereSql = implode(' AND ', $where);

        $sql = "SELECT r.*, 
                       l.name as location_name, l.name_te as location_name_te,
                       c.complaint_number, c.status as complaint_status,
                       org.name as assigned_organization_name
                FROM rainwater_reports r
                LEFT JOIN locations l ON r.location_id = l.id
                LEFT JOIN complaints c ON r.complaint_id = c.id
                LEFT JOIN organizations org ON c.assigned_organization_id = org.id
                WHERE {$whereSql}
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public static function countAll(array $filters = []): int {
        $pdo = Database::getConnection();
        $where = ["1=1"];
        $params = [];

        if (!empty($filters['availability_status'])) {
            $where[] = "r.availability_status = :availability_status";
            $params[':availability_status'] = $filters['availability_status'];
        }
        if (!empty($filters['condition_status'])) {
            $where[] = "r.condition_status = :condition_status";
            $params[':condition_status'] = $filters['condition_status'];
        }
        if (!empty($filters['verification_status'])) {
            $where[] = "r.verification_status = :verification_status";
            $params[':verification_status'] = $filters['verification_status'];
        }
        if (!empty($filters['location_id'])) {
            $where[] = "(r.location_id = :location_id OR l.parent_id = :parent_id)";
            $params[':location_id'] = (int)$filters['location_id'];
            $params[':parent_id']   = (int)$filters['location_id'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(r.report_number LIKE :search OR r.landmark LIKE :search OR r.description LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereSql = implode(' AND ', $where);
        $sql = "SELECT COUNT(*) FROM rainwater_reports r LEFT JOIN locations l ON r.location_id = l.id WHERE {$whereSql}";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn();
    }

    public static function verify(int $id, string $status, int $adminId, ?string $notes = null): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE rainwater_reports 
                               SET verification_status = :status,
                                   verified_by = :admin_id,
                                   verified_at = NOW(),
                                   verification_notes = :notes
                               WHERE id = :id");
        return $stmt->execute([
            ':id'       => $id,
            ':status'   => $status,
            ':admin_id' => $adminId,
            ':notes'    => $notes
        ]);
    }

    public static function linkComplaint(int $reportId, int $complaintId): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE rainwater_reports SET complaint_id = :complaint_id WHERE id = :id");
        return $stmt->execute([':complaint_id' => $complaintId, ':id' => $reportId]);
    }

    public static function getMapPoints(): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT r.id, r.report_number, r.report_type, r.availability_status, 
                                    r.condition_status, r.verification_status, r.latitude, r.longitude,
                                    r.landmark, r.created_at,
                                    l.name as location_name,
                                    c.complaint_number, c.status as complaint_status
                             FROM rainwater_reports r
                             JOIN locations l ON r.location_id = l.id
                             LEFT JOIN complaints c ON r.complaint_id = c.id
                             WHERE r.latitude IS NOT NULL AND r.longitude IS NOT NULL");
        return $stmt->fetchAll();
    }

    public static function getAnalytics(): array {
        $pdo = Database::getConnection();
        
        $totalReports = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports")->fetchColumn();
        $available = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE availability_status = 'available'")->fetchColumn();
        $notAvailable = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE availability_status = 'not_available'")->fetchColumn();
        $unknown = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE availability_status = 'unknown'")->fetchColumn();

        $blocked = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE condition_status = 'blocked'")->fetchColumn();
        $damaged = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE condition_status = 'damaged'")->fetchColumn();
        $partiallyBlocked = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE condition_status = 'partially_blocked'")->fetchColumn();
        $good = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE condition_status = 'good'")->fetchColumn();

        $waterlogging = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE report_type = 'waterlogging'")->fetchColumn();
        $overflow = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE report_type = 'rainwater_overflow'")->fetchColumn();

        $pendingVerification = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE verification_status = 'pending'")->fetchColumn();
        $verified = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE verification_status = 'verified'")->fetchColumn();
        $notVerified = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE verification_status = 'not_verified'")->fetchColumn();
        $rejected = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE verification_status = 'rejected'")->fetchColumn();

        // Linked complaint resolution metrics
        $withComplaint = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE complaint_id IS NOT NULL")->fetchColumn();
        $resolvedComplaints = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports r JOIN complaints c ON r.complaint_id = c.id WHERE c.status = 'resolved'")->fetchColumn();

        // Location breakdown
        $locStmt = $pdo->query("SELECT l.name as location_name, COUNT(r.id) as count 
                                FROM rainwater_reports r 
                                JOIN locations l ON r.location_id = l.id 
                                GROUP BY l.id, l.name 
                                ORDER BY count DESC LIMIT 10");
        $locationStats = $locStmt->fetchAll();

        return [
            'total_reports'          => $totalReports,
            'available'              => $available,
            'not_available'          => $notAvailable,
            'unknown'                => $unknown,
            'good'                   => $good,
            'partially_blocked'      => $partiallyBlocked,
            'blocked'                => $blocked,
            'damaged'                => $damaged,
            'waterlogging'           => $waterlogging,
            'rainwater_overflow'     => $overflow,
            'pending_verification'   => $pendingVerification,
            'verified'               => $verified,
            'not_verified'           => $notVerified,
            'rejected'               => $rejected,
            'with_complaint'         => $withComplaint,
            'resolved_complaints'    => $resolvedComplaints,
            'by_location'            => $locationStats
        ];
    }
}
