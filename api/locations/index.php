<?php
/**
 * ASR Water & Drainage - Locations Management API
 * Fetches and updates hierarchical Mandals and Localities in ASR District
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Fetch all mandals
        $mandalsStmt = $pdo->query("SELECT * FROM locations WHERE type = 'mandal' ORDER BY name ASC");
        $mandals = $mandalsStmt->fetchAll();

        // Fetch all child localities
        $localitiesStmt = $pdo->query("SELECT * FROM locations WHERE type = 'locality' ORDER BY name ASC");
        $allLocalities = $localitiesStmt->fetchAll();

        // Group localities under mandals
        $grouped = [];
        foreach ($mandals as $m) {
            $m['localities'] = array_values(array_filter($allLocalities, fn($l) => $l['parent_id'] == $m['id']));
            $grouped[] = $m;
        }

        echo json_encode(['success' => true, 'data' => $grouped]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $name     = trim($input['name'] ?? '');
        $name_te  = trim($input['name_te'] ?? '');
        $type     = $input['type'] ?? 'mandal';
        $parentId = $input['parent_id'] ?? null;
        $lat      = $input['latitude'] ?? null;
        $lng      = $input['longitude'] ?? null;

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Location name is required.']);
            exit;
        }

        $code = 'loc_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $name)) . '_' . substr(uniqid(), -4);

        $stmt = $pdo->prepare("INSERT INTO locations (code, name, name_te, type, parent_id, latitude, longitude, active)
                               VALUES (:code, :name, :name_te, :type, :parent_id, :lat, :lng, 1)");
        $stmt->execute([
            ':code'      => $code,
            ':name'      => $name,
            ':name_te'   => $name_te,
            ':type'      => $type,
            ':parent_id' => $parentId,
            ':lat'       => $lat,
            ':lng'       => $lng
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Location added successfully',
            'id'      => $pdo->lastInsertId()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}
