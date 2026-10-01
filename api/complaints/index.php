<?php
/**
 * ASR Water & Drainage - Complaints API Endpoint
 * Handles GET (filtered complaint list) and POST (new complaint registration)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ----------------------------------------------------------------------------
// GET: Fetch Complaints with Filters
// ----------------------------------------------------------------------------
if ($method === 'GET') {
    try {
        $mandal   = $_GET['mandal'] ?? 'all';
        $type     = $_GET['type'] ?? 'all';
        $status   = $_GET['status'] ?? 'all';
        $priority = $_GET['priority'] ?? 'all';
        $search   = trim($_GET['search'] ?? '');

        $sql = "SELECT c.*, 
                       m.name as mandal_name, m.name_te as mandal_name_te,
                       l.name as locality_name,
                       cat.name as category_name, cat.type as category_type, cat.icon as category_icon,
                       org.name as assigned_org_name
                FROM complaints c
                LEFT JOIN locations m ON c.mandal_id = m.id
                LEFT JOIN locations l ON c.locality_id = l.id
                JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN organizations org ON c.assigned_organization_id = org.id
                WHERE 1=1";

        $params = [];

        if ($mandal !== 'all') {
            $sql .= " AND (m.code = :mandal OR m.id = :mandal_id)";
            $params[':mandal'] = $mandal;
            $params[':mandal_id'] = $mandal;
        }

        if ($type !== 'all') {
            $sql .= " AND cat.type = :type";
            $params[':type'] = $type;
        }

        if ($status !== 'all') {
            $sql .= " AND c.status = :status";
            $params[':status'] = $status;
        }

        if ($priority !== 'all') {
            $sql .= " AND c.system_priority = :priority";
            $params[':priority'] = $priority;
        }

        if (!empty($search)) {
            $sql .= " AND (c.complaint_id LIKE :search OR c.description LIKE :search OR m.name LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        $sql .= " ORDER BY c.created_at DESC LIMIT 200";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $complaints = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'count'   => count($complaints),
            'data'    => $complaints
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ----------------------------------------------------------------------------
// POST: Register New Complaint
// ----------------------------------------------------------------------------
if ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $mandalId        = $input['mandal_id'] ?? null;
        $localityId      = $input['locality_id'] ?? null;
        $localityCustom  = $input['locality_custom'] ?? null;
        $landmark        = $input['landmark'] ?? null;
        $lat             = $input['lat'] ?? null;
        $lng             = $input['lng'] ?? null;
        $categoryId      = $input['category_id'] ?? null;
        $description     = trim($input['description'] ?? '');
        $citizenSeverity = $input['citizen_severity'] ?? 'Medium';
        $citizenName     = $input['citizen_name'] ?? null;
        $citizenPhone    = $input['citizen_phone'] ?? null;
        $citizenEmail    = $input['citizen_email'] ?? null;
        $photoPath       = $input['photo_path'] ?? null;
        $aiCategory      = $input['ai_category'] ?? null;
        $aiPriority      = $input['ai_priority'] ?? $citizenSeverity;

        if (empty($mandalId) || empty($categoryId) || empty($description)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Mandal, Category, and Description are required.']);
            exit;
        }

        // Generate next Complaint ID (e.g. ASR-WD-2026-000001)
        $year = date('Y');
        $countStmt = $pdo->query("SELECT COUNT(*) FROM complaints WHERE YEAR(created_at) = '$year'");
        $seq = (int)$countStmt->fetchColumn() + 1;
        $complaintId = sprintf("ASR-WD-%s-%06d", $year, $seq);

        $insertSql = "INSERT INTO complaints 
            (complaint_id, mandal_id, locality_id, locality_custom, landmark, latitude, longitude, 
             category_id, description, citizen_name, citizen_phone, citizen_email, photo_path, 
             citizen_severity, system_priority, ai_category, ai_priority, status, verification_level, public_notes) 
            VALUES 
            (:complaint_id, :mandal_id, :locality_id, :locality_custom, :landmark, :lat, :lng, 
             :category_id, :description, :citizen_name, :citizen_phone, :citizen_email, :photo_path, 
             :citizen_severity, :system_priority, :ai_category, :ai_priority, 'Submitted', 'Citizen Reported', 'Complaint registered successfully.')";

        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            ':complaint_id'     => $complaintId,
            ':mandal_id'        => $mandalId,
            ':locality_id'      => $localityId ?: null,
            ':locality_custom'  => $localityCustom ?: null,
            ':landmark'         => $landmark,
            ':lat'              => $lat,
            ':lng'              => $lng,
            ':category_id'      => $categoryId,
            ':description'      => $description,
            ':citizen_name'     => $citizenName,
            ':citizen_phone'    => $citizenPhone,
            ':citizen_email'    => $citizenEmail,
            ':photo_path'       => $photoPath,
            ':citizen_severity' => $citizenSeverity,
            ':system_priority'  => $citizenSeverity,
            ':ai_category'      => $aiCategory,
            ':ai_priority'      => $aiPriority
        ]);

        $newDbId = $pdo->lastInsertId();

        // Record initial timeline audit entry
        $updateSql = "INSERT INTO complaint_updates (complaint_id, old_status, new_status, note, is_public) 
                      VALUES (:comp_id, NULL, 'Submitted', 'Complaint submitted by citizen via portal.', 1)";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([':comp_id' => $newDbId]);

        echo json_encode([
            'success'      => true,
            'message'      => 'Complaint registered successfully',
            'complaint_id' => $complaintId,
            'id'           => $newDbId
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
