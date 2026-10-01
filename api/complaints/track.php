<?php
/**
 * ASR Water & Drainage - Complaint Tracking API
 * Fetches public audit progress for a single complaint by ID.
 * Strictly excludes private citizen contact info and internal notes.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

$complaintId = trim($_GET['id'] ?? '');

if (empty($complaintId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Complaint ID is required.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("SELECT c.id, c.complaint_id, c.created_at, c.updated_at,
                                  c.description, c.citizen_severity, c.system_priority,
                                  c.status, c.verification_level, c.public_notes, c.photo_path,
                                  c.resolution_photo_path, c.resolution_recorded_at,
                                  m.name as mandal_name, m.name_te as mandal_name_te,
                                  l.name as locality_name, c.locality_custom, c.landmark,
                                  cat.name as category_name, cat.name_te as category_name_te, cat.type as category_type,
                                  org.name as assigned_org_name
                           FROM complaints c
                           LEFT JOIN locations m ON c.mandal_id = m.id
                           LEFT JOIN locations l ON c.locality_id = l.id
                           JOIN categories cat ON c.category_id = cat.id
                           LEFT JOIN organizations org ON c.assigned_organization_id = org.id
                           WHERE c.complaint_id = :id");

    $stmt->execute([':id' => $complaintId]);
    $complaint = $stmt->fetch();

    if (!$complaint) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Complaint record not found.']);
        exit;
    }

    // Fetch timeline updates
    $timelineStmt = $pdo->prepare("SELECT new_status as status, note, created_at as timestamp 
                                   FROM complaint_updates 
                                   WHERE complaint_id = :cid AND is_public = 1 
                                   ORDER BY created_at ASC");
    $timelineStmt->execute([':cid' => $complaint['id']]);
    $complaint['timeline'] = $timelineStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data'    => $complaint
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
