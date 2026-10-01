<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Organization Model
 */

require_once __DIR__ . '/../config/database.php';

class Organization {
    public static function findById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM organizations WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $org = $stmt->fetch();
        return $org ?: null;
    }

    public static function getAll(bool $activeOnly = true): array {
        $pdo = Database::getConnection();
        $sql = "SELECT o.*, 
                       (SELECT COUNT(*) FROM complaints c WHERE c.assigned_organization_id = o.id) as assigned_complaints_count,
                       (SELECT COUNT(*) FROM organization_users ou WHERE ou.organization_id = o.id) as members_count 
                FROM organizations o";
        if ($activeOnly) {
            $sql .= " WHERE o.status = 'active'";
        }
        $sql .= " ORDER BY o.name ASC";

        return $pdo->query($sql)->fetchAll();
    }

    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO organizations 
            (name, description, organization_type, contact_email, contact_phone, status) 
            VALUES (:name, :description, :organization_type, :contact_email, :contact_phone, :status)");
        
        $stmt->execute([
            ':name'              => $data['name'],
            ':description'       => $data['description'] ?? null,
            ':organization_type' => $data['organization_type'] ?? 'Civic Maintenance',
            ':contact_email'     => $data['contact_email'] ?? null,
            ':contact_phone'     => $data['contact_phone'] ?? null,
            ':status'            => $data['status'] ?? 'active'
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function update(int $id, array $data): bool {
        $pdo = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        foreach (['name', 'description', 'organization_type', 'contact_email', 'contact_phone', 'status'] as $col) {
            if (array_key_exists($col, $data)) {
                $fields[] = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE organizations SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public static function addUser(int $orgId, int $userId, string $role = 'field_agent'): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO organization_users (organization_id, user_id, role) 
                               VALUES (:org_id, :user_id, :role) 
                               ON DUPLICATE KEY UPDATE role = :role_up");
        return $stmt->execute([
            ':org_id'   => $orgId,
            ':user_id'  => $userId,
            ':role'     => $role,
            ':role_up'  => $role
        ]);
    }

    public static function getUsers(int $orgId): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT u.id, u.name, u.email, u.phone, ou.role as org_role, ou.created_at as joined_at 
                               FROM organization_users ou 
                               JOIN users u ON ou.user_id = u.id 
                               WHERE ou.organization_id = :org_id");
        $stmt->execute([':org_id' => $orgId]);
        return $stmt->fetchAll();
    }

    public static function isUserMember(int $orgId, int $userId): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM organization_users WHERE organization_id = :org_id AND user_id = :user_id");
        $stmt->execute([':org_id' => $orgId, ':user_id' => $userId]);
        return (int)$count = (int)$stmt->fetchColumn() > 0;
    }
}
