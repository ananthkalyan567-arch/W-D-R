<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - User Model
 */

require_once __DIR__ . '/../config/database.php';

class User {
    public static function findById(int $id): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();
        return $user ? self::toSafeArray($user) : null;
    }

    public static function findByEmail(string $email): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function findByPhone(string $phone): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = :phone LIMIT 1");
        $stmt->execute([':phone' => $phone]);
        $user = $stmt->fetch();
        return $user ?: null;
    }

    public static function create(array $data): int {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("INSERT INTO users 
            (name, email, phone, password_hash, role, status, preferred_language) 
            VALUES (:name, :email, :phone, :password_hash, :role, :status, :preferred_language)");
        
        $stmt->execute([
            ':name'               => $data['name'],
            ':email'              => !empty($data['email']) ? $data['email'] : null,
            ':phone'              => !empty($data['phone']) ? $data['phone'] : null,
            ':password_hash'      => $data['password_hash'],
            ':role'               => $data['role'] ?? 'citizen',
            ':status'             => $data['status'] ?? 'active',
            ':preferred_language' => $data['preferred_language'] ?? 'en'
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function update(int $id, array $data): bool {
        $pdo = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        foreach (['name', 'email', 'phone', 'preferred_language', 'status', 'role'] as $col) {
            if (array_key_exists($col, $data)) {
                $fields[] = "{$col} = :{$col}";
                $params[":{$col}"] = $data[$col];
            }
        }

        if (empty($fields)) {
            return false;
        }

        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute($params);
    }

    public static function updateLastLogin(int $id): void {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }

    public static function getAll(array $filters = [], int $page = 1, int $limit = 20): array {
        $pdo = Database::getConnection();
        $offset = ($page - 1) * $limit;

        $where = ["1=1"];
        $params = [];

        if (!empty($filters['role'])) {
            $where[] = "role = :role";
            $params[':role'] = $filters['role'];
        }
        if (!empty($filters['status'])) {
            $where[] = "status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['search'])) {
            $where[] = "(name LIKE :search OR email LIKE :search OR phone LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE {$whereSql}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "SELECT id, name, email, phone, role, status, preferred_language, last_login_at, created_at 
                FROM users WHERE {$whereSql} ORDER BY id DESC LIMIT :limit OFFSET :offset";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'users' => $stmt->fetchAll(),
            'total' => $total,
            'page'  => $page,
            'limit' => $limit
        ];
    }

    public static function toSafeArray(array $user): array {
        unset($user['password_hash']);
        return $user;
    }
}
