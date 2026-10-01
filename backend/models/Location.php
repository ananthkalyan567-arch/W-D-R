<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Location Model (Hierarchical)
 */

require_once __DIR__ . '/../config/database.php';

class Location {
    public static function findById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT l.*, p.name as parent_name 
                               FROM locations l 
                               LEFT JOIN locations p ON l.parent_id = p.id 
                               WHERE l.id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $loc = $stmt->fetch();
        return $loc ?: null;
    }

    public static function getTree(bool $activeOnly = true): array {
        $pdo = Database::getConnection();
        $sql = "SELECT l.*, 
                       (SELECT COUNT(*) FROM complaints c WHERE c.location_id = l.id) as complaint_count 
                FROM locations l";
        if ($activeOnly) {
            $sql .= " WHERE l.status = 'active'";
        }
        $sql .= " ORDER BY l.name ASC";

        $stmt = $pdo->query($sql);
        $all = $stmt->fetchAll();

        // Build nested tree structure
        $itemsByParent = [];
        foreach ($all as $item) {
            $parentId = $item['parent_id'] ?? 0;
            $itemsByParent[$parentId][] = $item;
        }

        return self::buildSubTree($itemsByParent, null);
    }

    private static function buildSubTree(array &$itemsByParent, ?int $parentId): array {
        $key = $parentId ?? 0;
        if (!isset($itemsByParent[$key])) {
            return [];
        }

        $branch = [];
        foreach ($itemsByParent[$key] as $item) {
            $children = self::buildSubTree($itemsByParent, (int)$item['id']);
            if (!empty($children)) {
                $item['children'] = $children;
            }
            $branch[] = $item;
        }

        return $branch;
    }

    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO locations 
            (name, name_te, parent_id, location_type, latitude, longitude, status) 
            VALUES (:name, :name_te, :parent_id, :location_type, :latitude, :longitude, :status)");
        
        $stmt->execute([
            ':name'          => $data['name'],
            ':name_te'       => $data['name_te'] ?? null,
            ':parent_id'     => !empty($data['parent_id']) ? (int)$data['parent_id'] : null,
            ':location_type' => $data['location_type'] ?? 'mandal',
            ':latitude'      => !empty($data['latitude']) ? (float)$data['latitude'] : null,
            ':longitude'     => !empty($data['longitude']) ? (float)$data['longitude'] : null,
            ':status'        => $data['status'] ?? 'active'
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function update(int $id, array $data): bool {
        $pdo = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        foreach (['name', 'name_te', 'parent_id', 'location_type', 'latitude', 'longitude', 'status'] as $col) {
            if (array_key_exists($col, $data)) {
                $fields[] = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE locations SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public static function toggleStatus(int $id, string $status): bool {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE locations SET status = :status WHERE id = :id");
        return $stmt->execute([':status' => $status, ':id' => $id]);
    }
}
