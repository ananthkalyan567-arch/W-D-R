<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Analytics & Reporting Intelligence Service
 * Aggregates actual database statistics for admin intelligence.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Complaint.php';

class AnalyticsService {
    public static function getSummary(?int $locationId = null, ?int $orgId = null): array {
        return Complaint::getDashboardCounts($locationId, $orgId);
    }

    public static function getTrends(int $days = 30): array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT DATE(created_at) as date, 
                                      COUNT(*) as total,
                                      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
                               FROM complaints 
                               WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
                               GROUP BY DATE(created_at)
                               ORDER BY date ASC");
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public static function getCategoriesBreakdown(): array {
        $pdo = Database::getConnection();
        $sql = "SELECT cat.name as category_name, cat.type as category_type, COUNT(c.id) as count 
                FROM complaints c 
                JOIN categories cat ON c.category_id = cat.id 
                GROUP BY cat.id 
                ORDER BY count DESC";
        return $pdo->query($sql)->fetchAll();
    }

    public static function getLocationsBreakdown(): array {
        $pdo = Database::getConnection();
        $sql = "SELECT l.name as location_name, COUNT(c.id) as count 
                FROM complaints c 
                JOIN locations l ON c.location_id = l.id 
                GROUP BY l.id 
                ORDER BY count DESC LIMIT 10";
        return $pdo->query($sql)->fetchAll();
    }

    public static function getStatusDistribution(): array {
        $pdo = Database::getConnection();
        $sql = "SELECT status, COUNT(*) as count FROM complaints GROUP BY status";
        return $pdo->query($sql)->fetchAll();
    }

    public static function getResolutionTimeMetrics(): array {
        $pdo = Database::getConnection();
        $sql = "SELECT 
                    COUNT(*) as resolved_count,
                    ROUND(AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)), 1) as avg_resolution_hours,
                    ROUND(MIN(TIMESTAMPDIFF(HOUR, created_at, resolved_at)), 1) as min_resolution_hours,
                    ROUND(MAX(TIMESTAMPDIFF(HOUR, created_at, resolved_at)), 1) as max_resolution_hours
                FROM complaints 
                WHERE status = 'resolved' AND resolved_at IS NOT NULL";
        
        $res = $pdo->query($sql)->fetch();
        return [
            'resolved_count'       => (int)($res['resolved_count'] ?? 0),
            'avg_resolution_hours' => (float)($res['avg_resolution_hours'] ?? 0),
            'min_resolution_hours' => (float)($res['min_resolution_hours'] ?? 0),
            'max_resolution_hours' => (float)($res['max_resolution_hours'] ?? 0)
        ];
    }
}
