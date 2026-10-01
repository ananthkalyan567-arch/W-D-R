<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - ComplaintController (Citizen & Public API)
 */

require_once __DIR__ . '/../services/ComplaintService.php';
require_once __DIR__ . '/../services/AIService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../helpers/response.php';

class ComplaintController {
    public function create(): void {
        $user = AuthMiddleware::optional();
        $userId = $user ? (int)$user['id'] : null;

        $input = !empty($_POST) ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);

        $v = Validator::make($input)
            ->required('location_id', 'category_id', 'description')
            ->minLength('description', 10)
            ->coordinates('latitude', 'longitude');

        if (!empty($input['citizen_severity'])) {
            $v->in('citizen_severity', ['low', 'medium', 'high', 'critical']);
        }

        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        // Handle Photo File Upload
        $photoPath = null;
        if (!empty($_FILES['photo'])) {
            $uploadCheck = Security::validateUploadedFile($_FILES['photo']);
            if (!$uploadCheck['valid']) {
                jsonError($uploadCheck['error'], "INVALID_FILE_UPLOAD", 422);
            }

            $uploadDir = __DIR__ . '/../uploads';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $destPath = $uploadDir . '/' . $uploadCheck['safe_name'];
            if (!move_uploaded_file($_FILES['photo']['tmp_name'], $destPath)) {
                jsonError("Failed to store uploaded photo evidence.", "UPLOAD_SAVE_ERROR", 500);
            }

            $photoPath = 'uploads/' . $uploadCheck['safe_name'];
        }

        // Optional AI Duplicate & Priority Detection
        $aiCheck = AIService::detectDuplicate(
            (string)$input['description'],
            (int)$input['location_id'],
            (int)$input['category_id']
        );

        $data = [
            'location_id'      => (int)$input['location_id'],
            'category_id'      => (int)$input['category_id'],
            'title'            => $input['title'] ?? mb_substr((string)$input['description'], 0, 60),
            'description'      => (string)$input['description'],
            'landmark'         => $input['landmark'] ?? null,
            'latitude'         => !empty($input['latitude']) ? (float)$input['latitude'] : null,
            'longitude'        => !empty($input['longitude']) ? (float)$input['longitude'] : null,
            'photo_path'       => $photoPath,
            'citizen_severity' => strtolower($input['citizen_severity'] ?? 'medium'),
            'ai_category'      => $input['ai_category'] ?? null,
            'ai_priority'      => $input['ai_priority'] ?? null
        ];

        try {
            $complaint = ComplaintService::createComplaint($data, $userId);

            $response = [
                'complaint' => $complaint,
                'ai_check'  => $aiCheck
            ];

            jsonSuccess("Complaint submitted successfully.", $response, 201);
        } catch (Exception $e) {
            jsonError("Failed to file complaint: " . $e->getMessage(), "INTERNAL_ERROR", 500);
        }
    }

    public function index(): void {
        $user = AuthMiddleware::optional();
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

        $filters = [
            'status'        => $_GET['status'] ?? null,
            'category_type' => $_GET['type'] ?? null,
            'location_id'   => $_GET['location_id'] ?? null,
            'search'        => $_GET['search'] ?? null
        ];

        // If citizen queries /api/v1/complaints?scope=mine, restrict to their own
        if (($user && ($user['role'] === 'citizen')) && (($_GET['scope'] ?? '') === 'mine')) {
            $filters['user_id'] = $user['id'];
        }

        $result = Complaint::getAll($filters, $page, $limit);

        // Sanitize out private citizen details for public directory listing
        $sanitizedComplaints = array_map(function($c) use ($user) {
            if (!$user || ($user['role'] === 'citizen' && $user['id'] != $c['user_id'])) {
                unset($c['citizen_phone'], $c['citizen_email'], $c['citizen_name']);
            }
            return $c;
        }, $result['complaints']);

        $pagination = [
            'page'        => $result['page'],
            'limit'       => $result['limit'],
            'total'       => $result['total'],
            'total_pages' => $result['total_pages']
        ];

        jsonSuccess("Complaints retrieved.", $sanitizedComplaints, 200, $pagination);
    }

    public function show(int $id): void {
        $complaint = Complaint::findById($id);
        if (!$complaint) {
            jsonError("Complaint not found.", "COMPLAINT_NOT_FOUND", 404);
        }

        $user = AuthMiddleware::optional();

        // Privacy protection: Anonymize citizen contact details if not admin or owner
        if (!$user || ($user['role'] === 'citizen' && $user['id'] != $complaint['user_id'])) {
            unset($complaint['citizen_phone'], $complaint['citizen_email'], $complaint['citizen_name']);
        }

        $timeline = ComplaintUpdate::getByComplaintId($id, true);
        $complaint['timeline'] = $timeline;

        jsonSuccess("Complaint details retrieved.", $complaint);
    }

    public function track(): void {
        $number = trim($_GET['number'] ?? ($_GET['id'] ?? ''));
        if (empty($number)) {
            jsonError("Complaint tracking number is required.", "NUMBER_REQUIRED", 422);
        }

        $complaint = Complaint::findByComplaintNumber($number);
        if (!$complaint) {
            jsonError("No complaint found with number {$number}.", "COMPLAINT_NOT_FOUND", 404);
        }

        // Public tracking: Return public timeline, never expose internal or citizen sensitive details
        unset($complaint['citizen_phone'], $complaint['citizen_email']);

        $timeline = ComplaintUpdate::getByComplaintId((int)$complaint['id'], true);
        $complaint['timeline'] = $timeline;

        jsonSuccess("Complaint tracking retrieved.", $complaint);
    }

    public function timeline(int $id): void {
        $complaint = Complaint::findById($id);
        if (!$complaint) {
            jsonError("Complaint not found.", "COMPLAINT_NOT_FOUND", 404);
        }

        $timeline = ComplaintUpdate::getByComplaintId($id, true);
        jsonSuccess("Complaint timeline retrieved.", $timeline);
    }

    public function map(): void {
        $filters = [
            'location_id' => $_GET['location_id'] ?? null,
            'category'    => $_GET['category'] ?? null,
            'status'      => $_GET['status'] ?? null,
            'priority'    => $_GET['priority'] ?? null
        ];

        $points = Complaint::getMapPoints($filters);
        jsonSuccess("Map complaints retrieved.", $points);
    }

    public function addUpdate(int $id): void {
        $user = AuthMiddleware::handle();
        $complaint = Complaint::findById($id);

        if (!$complaint) {
            jsonError("Complaint not found.", "COMPLAINT_NOT_FOUND", 404);
        }

        // Only the owner citizen, organization officer, or admin can post update
        if ($user['role'] === 'citizen' && $user['id'] != $complaint['user_id']) {
            jsonError("Unauthorized to add updates to this complaint.", "FORBIDDEN", 403);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        if (empty($input['message']) || mb_strlen(trim($input['message'])) < 3) {
            jsonError("A message is required.", "MESSAGE_REQUIRED", 422);
        }

        ComplaintUpdate::create(
            $id,
            (int)$user['id'],
            $complaint['status'],
            $complaint['status'],
            trim((string)$input['message']),
            true
        );

        jsonSuccess("Update posted to complaint timeline.");
    }
}
