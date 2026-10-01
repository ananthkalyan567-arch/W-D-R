<?php
/**
 * ASR Water & Drainage - District Analytics & KPI Metrics API
 * Calculates live database aggregates without simulated statistics.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = Database::getConnection();

    // 1. Overall counts
    $countsQuery = $pdo->query("SELECT
        COUNT(*) as total,
        SUM(CASE WHEN cat.type = 'water' THEN 1 ELSE 0 END) as water,
        SUM(CASE WHEN cat.type = 'drainage' THEN 1 ELSE 0 END) as drainage,
        SUM(CASE WHEN c.status IN ('Submitted', 'Under Review', 'Assigned') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN c.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN c.system_priority IN ('High', 'Emergency') THEN 1 ELSE 0 END) as emergency
    FROM complaints c
    JOIN categories cat ON c.category_id = cat.id");

    $metrics = $countsQuery->fetch();

    // 2. Counts grouped by Mandal
    $mandalQuery = $pdo->query("SELECT m.name as mandal_name, COUNT(c.id) as count
                                FROM complaints c
                                JOIN locations m ON c.mandal_id = m.id
                                GROUP BY m.id
                                ORDER BY count DESC LIMIT 8");
    $byMandal = $mandalQuery->fetchAll();

    echo json_encode([
        'success' => true,
        'metrics' => [
            'total'       => (int)($metrics['total'] ?? 0),
            'water'       => (int)($metrics['water'] ?? 0),
            'drainage'    => (int)($metrics['drainage'] ?? 0),
            'pending'     => (int)($metrics['pending'] ?? 0),
            'in_progress' => (int)($metrics['in_progress'] ?? 0),
            'resolved'    => (int)($metrics['resolved'] ?? 0),
            'emergency'   => (int)($metrics['emergency'] ?? 0),
        ],
        'by_mandal' => $byMandal
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
