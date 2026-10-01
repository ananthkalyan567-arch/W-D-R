<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - AuditLog Model
 * Enforces immutable audit logging for administrative actions.
 */

require_once __DIR__ . '/../config/database.php';

class AuditLog {
    public static function log(
        ?int $userId,
        string $action,
        string $entityType,
        int $entityId,
        ?array $oldValues = null,
        ?array $newValues = null
    ): int {
        $pdo = Database::getConnection();
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $agent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 250);

        $stmt = $pdo->prepare("INSERT INTO audit_logs 
            (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent) 
            VALUES (:user_id, :action, :entity_type, :entity_id, :old_values, :new_values, :ip, :agent)");

        $stmt->execute([
            ':user_id'     => $userId,
            ':action'      => $action,
            ':entity_type' => $entityType,
            ':entity_id'   => $entityId,
            ':old_values'  => $oldValues !== null ? json_encode($oldValues, JSON_UNESCAPED_SLASHES) : null,
            ':new_values'  => $newValues !== null ? json_encode($newValues, JSON_UNESCAPED_SLASHES) : null,
            ':ip'          => $ip,
            ':agent'       => $agent
        ]);

        return (int)$pdo->lastInsertId();
    }

    public static function getAll(int $page = 1, int $limit = 50): array {
        $pdo = Database::getConnection();
        $offset = ($page - 1) * $limit;

        $countStmt = $pdo->query("SELECT COUNT(*) FROM audit_logs");
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role 
                               FROM audit_logs a 
                               LEFT JOIN users u ON a.user_id = u.id 
                               ORDER BY a.created_at DESC 
                               LIMIT :limit OFFSET :offset");
        
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'logs'        => $stmt->fetchAll(),
            'total'       => $total,
            'page'        => $page,
            'limit'       => $limit,
            'total_pages' => (int)ceil($total / $limit)
        ];
    }
}
