<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Complaint Model
 */

require_once __DIR__ . '/../config/database.php';

class Complaint {
    public static function generateComplaintNumber(string $prefix = 'ASR-WD'): string {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT MAX(id) FROM complaints");
        $nextId = ((int)$stmt->fetchColumn()) + 1;
        return sprintf("%s-%06d", $prefix, $nextId);
    }

    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $prefix = $data['prefix'] ?? 'ASR-WD';
        $number = !empty($data['complaint_number']) ? $data['complaint_number'] : self::generateComplaintNumber($prefix);

        $stmt = $pdo->prepare("INSERT INTO complaints 
            (complaint_number, user_id, location_id, category_id, title, description, landmark, 
             latitude, longitude, photo_path, citizen_severity, system_priority, ai_category, ai_priority, status) 
            VALUES 
            (:complaint_number, :user_id, :location_id, :category_id, :title, :description, :landmark, 
             :latitude, :longitude, :photo_path, :citizen_severity, :system_priority, :ai_category, :ai_priority, 'submitted')");

        $stmt->execute([
            ':complaint_number'  => $number,
            ':user_id'           => !empty($data['user_id']) ? (int)$data['user_id'] : null,
            ':location_id'       => (int)$data['location_id'],
            ':category_id'       => (int)$data['category_id'],
            ':title'             => $data['title'],
            ':description'       => $data['description'],
            ':landmark'          => $data['landmark'] ?? null,
            ':latitude'          => !empty($data['latitude']) ? (float)$data['latitude'] : null,
            ':longitude'         => !empty($data['longitude']) ? (float)$data['longitude'] : null,
            ':photo_path'        => $data['photo_path'] ?? null,
            ':citizen_severity'  => $data['citizen_severity'] ?? 'medium',
            ':system_priority'   => $data['system_priority'] ?? ($data['citizen_severity'] ?? 'medium'),
            ':ai_category'       => $data['ai_category'] ?? null,
            ':ai_priority'       => $data['ai_priority'] ?? null
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function findById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT c.*, 
                                      l.name as location_name, l.name_te as location_name_te, l.location_type,
                                      cat.name as category_name, cat.name_te as category_name_te, cat.type as category_type,
                                      org.name as assigned_organization_name,
                                      u.name as citizen_name, u.phone as citizen_phone, u.email as citizen_email
                               FROM complaints c
                               LEFT JOIN locations l ON c.location_id = l.id
                               LEFT JOIN categories cat ON c.category_id = cat.id
                               LEFT JOIN organizations org ON c.assigned_organization_id = org.id
                               LEFT JOIN users u ON c.user_id = u.id
                               WHERE c.id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function findByComplaintNumber(string $number): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT c.*, 
                                      l.name as location_name, l.name_te as location_name_te,
                                      cat.name as category_name, cat.name_te as category_name_te, cat.type as category_type,
                                      org.name as assigned_organization_name
                               FROM complaints c
                               LEFT JOIN locations l ON c.location_id = l.id
                               LEFT JOIN categories cat ON c.category_id = cat.id
                               LEFT JOIN organizations org ON c.assigned_organization_id = org.id
                               WHERE c.complaint_number = :number LIMIT 1");
        $stmt->execute([':number' => strtoupper(trim($number))]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function getAll(array $filters = [], int $page = 1, int $limit = 20): array {
        $pdo = Database::getConnection();
        $offset = ($page - 1) * $limit;

        $where = ["1=1"];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = "c.status = :status";
            $params[':status'] = $filters['status'];
        }

        if (!empty($filters['priority'])) {
            $where[] = "c.system_priority = :priority";
            $params[':priority'] = $filters['priority'];
        }

        if (!empty($filters['category_id'])) {
            $where[] = "c.category_id = :category_id";
            $params[':category_id'] = (int)$filters['category_id'];
        }

        if (!empty($filters['category_type'])) {
            $where[] = "cat.type = :category_type";
            $params[':category_type'] = $filters['category_type'];
        }

        if (!empty($filters['location_id'])) {
            $where[] = "(c.location_id = :loc_id OR l.parent_id = :loc_id_p)";
            $params[':loc_id'] = (int)$filters['location_id'];
            $params[':loc_id_p'] = (int)$filters['location_id'];
        }

        if (!empty($filters['assigned_organization_id'])) {
            $where[] = "c.assigned_organization_id = :org_id";
            $params[':org_id'] = (int)$filters['assigned_organization_id'];
        }

        if (!empty($filters['user_id'])) {
            $where[] = "c.user_id = :user_id";
            $params[':user_id'] = (int)$filters['user_id'];
        }

        if (!empty($filters['date_from'])) {
            $where[] = "c.created_at >= :date_from";
            $params[':date_from'] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[] = "c.created_at <= :date_to";
            $params[':date_to'] = $filters['date_to'] . ' 23:59:59';
        }

        if (!empty($filters['search'])) {
            $where[] = "(c.complaint_number LIKE :search OR c.title LIKE :search OR c.description LIKE :search OR l.name LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereSql = implode(' AND ', $where);

        $countSql = "SELECT COUNT(*) FROM complaints c 
                     LEFT JOIN locations l ON c.location_id = l.id
                     LEFT JOIN categories cat ON c.category_id = cat.id 
                     WHERE {$whereSql}";
        
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "SELECT c.*, 
                       l.name as location_name, l.name_te as location_name_te,
                       cat.name as category_name, cat.type as category_type,
                       org.name as assigned_organization_name
                FROM complaints c
                LEFT JOIN locations l ON c.location_id = l.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN organizations org ON c.assigned_organization_id = org.id
                WHERE {$whereSql}
                ORDER BY c.created_at DESC 
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'complaints'  => $stmt->fetchAll(),
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => (int)ceil($total / $limit)
        ];
    }

    public static function updateStatus(int $id, string $status, ?string $notes = null): bool {
        $pdo = Database::getConnection();
        $fields = ["status = :status"];
        $params = [':status' => $status, ':id' => $id];

        if ($status === 'resolved') {
            $fields[] = "resolved_at = NOW()";
        } elseif ($status === 'closed') {
            $fields[] = "closed_at = NOW()";
        }

        if ($notes !== null) {
            $fields[] = "resolution_notes = :notes";
            $params[':notes'] = $notes;
        }

        $sql = "UPDATE complaints SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public static function getDashboardCounts(?int $locationId = null, ?int $orgId = null): array {
        $pdo = Database::getConnection();
        $where = ["1=1"];
        $params = [];

        if ($locationId !== null) {
            $where[] = "(c.location_id = :loc_id)";
            $params[':loc_id'] = $locationId;
        }
        if ($orgId !== null) {
            $where[] = "c.assigned_organization_id = :org_id";
            $params[':org_id'] = $orgId;
        }

        $whereSql = implode(' AND ', $where);

        $sql = "SELECT 
            COUNT(*) as total_complaints,
            SUM(CASE WHEN c.status = 'submitted' THEN 1 ELSE 0 END) as new_complaints,
            SUM(CASE WHEN c.status = 'under_review' THEN 1 ELSE 0 END) as under_review,
            SUM(CASE WHEN c.status = 'assigned' THEN 1 ELSE 0 END) as assigned,
            SUM(CASE WHEN c.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN c.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN c.status = 'closed' THEN 1 ELSE 0 END) as closed,
            SUM(CASE WHEN c.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN c.system_priority = 'critical' THEN 1 ELSE 0 END) as critical_complaints,
            SUM(CASE WHEN cat.type = 'water' THEN 1 ELSE 0 END) as water_complaints,
            SUM(CASE WHEN cat.type = 'drainage' THEN 1 ELSE 0 END) as drainage_complaints,
            SUM(CASE WHEN cat.type = 'rainwater' THEN 1 ELSE 0 END) as rainwater_complaints,
            SUM(CASE WHEN cat.type = 'rainwater' THEN 1 ELSE 0 END) as rainwater_issues
        FROM complaints c
        JOIN categories cat ON c.category_id = cat.id
        WHERE {$whereSql}";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $res = $stmt->fetch();

        $counts = array_map(fn($v) => (int)$v, $res ?: []);

        // Rainwater infrastructure indicators
        try {
            $counts['missing_rainwater_openings'] = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE availability_status = 'not_available'")->fetchColumn();
            $counts['blocked_openings'] = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE condition_status = 'blocked'")->fetchColumn();
            $counts['damaged_openings'] = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE condition_status = 'damaged'")->fetchColumn();
            $counts['waterlogging_reports'] = (int)$pdo->query("SELECT COUNT(*) FROM rainwater_reports WHERE report_type = 'waterlogging'")->fetchColumn();
        } catch (Throwable $e) {
            // Table may not be created yet during first migration check
        }

        return $counts;
    }

    public static function getMapPoints(array $filters = []): array {
        $pdo = Database::getConnection();
        $where = ["c.latitude IS NOT NULL AND c.longitude IS NOT NULL"];
        $params = [];

        if (!empty($filters['location_id'])) {
            $where[] = "c.location_id = :loc_id";
            $params[':loc_id'] = (int)$filters['location_id'];
        }
        if (!empty($filters['category'])) {
            $where[] = "cat.type = :cat_type";
            $params[':cat_type'] = $filters['category'];
        }
        if (!empty($filters['status'])) {
            $where[] = "c.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['priority'])) {
            $where[] = "c.system_priority = :priority";
            $params[':priority'] = $filters['priority'];
        }

        $whereSql = implode(' AND ', $where);

        // Explicitly exclude sensitive citizen private columns
        $sql = "SELECT c.id, c.complaint_number, c.title, c.latitude, c.longitude, 
                       c.status, c.system_priority, c.created_at,
                       l.name as location_name, cat.name as category_name, cat.type as category_type
                FROM complaints c
                JOIN locations l ON c.location_id = l.id
                JOIN categories cat ON c.category_id = cat.id
                WHERE {$whereSql}
                LIMIT 500";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
