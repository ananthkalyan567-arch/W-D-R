<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Category Model
 */

require_once __DIR__ . '/../config/database.php';

class Category {
    public static function findById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $cat = $stmt->fetch();
        return $cat ?: null;
    }

    public static function getAll(?string $type = null, bool $activeOnly = true): array {
        $pdo = Database::getConnection();
        $sql = "SELECT c.*, 
                       (SELECT COUNT(*) FROM complaints comp WHERE comp.category_id = c.id) as complaint_count
                FROM categories c WHERE 1=1";
        $params = [];

        if ($type !== null && in_array($type, ['water', 'drainage'], true)) {
            $sql .= " AND c.type = :type";
            $params[':type'] = $type;
        }

        if ($activeOnly) {
            $sql .= " AND c.status = 'active'";
        }

        $sql .= " ORDER BY c.type ASC, c.name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO categories (name, name_te, type, description, status) 
                               VALUES (:name, :name_te, :type, :description, :status)");
        
        $stmt->execute([
            ':name'        => $data['name'],
            ':name_te'     => $data['name_te'] ?? null,
            ':type'        => $data['type'],
            ':description' => $data['description'] ?? null,
            ':status'      => $data['status'] ?? 'active'
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function update(int $id, array $data): bool {
        $pdo = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        foreach (['name', 'name_te', 'type', 'description', 'status'] as $col) {
            if (array_key_exists($col, $data)) {
                $fields[] = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE categories SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }
}
