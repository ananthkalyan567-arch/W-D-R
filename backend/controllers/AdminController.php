<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - AdminController
 * Privileged administrative commands, triage, assignments, and audit views.
 */

require_once __DIR__ . '/../services/ComplaintService.php';
require_once __DIR__ . '/../services/AnalyticsService.php';
require_once __DIR__ . '/../models/AuditLog.php';
require_once __DIR__ . '/../models/Assignment.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/response.php';

class AdminController {
    public function dashboard(): void {
        AdminMiddleware::handle();

        $locationId = !empty($_GET['location_id']) ? (int)$_GET['location_id'] : null;
        $summary = AnalyticsService::getSummary($locationId);
        $trends = AnalyticsService::getTrends(14);
        $recent = Complaint::getAll([], 1, 8);

        jsonSuccess("Dashboard metrics retrieved.", [
            'metrics' => $summary,
            'trends'  => $trends,
            'recent'  => $recent['complaints']
        ]);
    }

    public function complaints(): void {
        AdminMiddleware::handle();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 25)));

        $filters = [
            'status'                   => $_GET['status'] ?? null,
            'priority'                 => $_GET['priority'] ?? null,
            'category_id'              => $_GET['category_id'] ?? null,
            'category_type'            => $_GET['type'] ?? null,
            'location_id'              => $_GET['location_id'] ?? null,
            'assigned_organization_id' => $_GET['organization_id'] ?? null,
            'date_from'                => $_GET['date_from'] ?? null,
            'date_to'                  => $_GET['date_to'] ?? null,
            'search'                   => $_GET['search'] ?? null
        ];

        $result = Complaint::getAll($filters, $page, $limit);

        $pagination = [
            'page'        => $result['page'],
            'limit'       => $result['limit'],
            'total'       => $result['total'],
            'total_pages' => $result['total_pages']
        ];

        jsonSuccess("Admin complaints list retrieved.", $result['complaints'], 200, $pagination);
    }

    public function complaint(int $id): void {
        AdminMiddleware::handle();

        $complaint = Complaint::findById($id);
        if (!$complaint) {
            jsonError("Complaint record not found.", "COMPLAINT_NOT_FOUND", 404);
        }

        $complaint['timeline'] = ComplaintUpdate::getByComplaintId($id, false);
        $complaint['assignments'] = Assignment::getByComplaintId($id);

        jsonSuccess("Complaint record retrieved.", $complaint);
    }

    public function assign(int $id): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)->required('organization_id');
        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        try {
            $updated = ComplaintService::assignComplaint(
                $id,
                (int)$input['organization_id'],
                !empty($input['assigned_user_id']) ? (int)$input['assigned_user_id'] : null,
                (int)$admin['id'],
                $input['notes'] ?? null
            );

            jsonSuccess("Complaint successfully assigned.", $updated);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "ASSIGNMENT_ERROR", 400);
        }
    }

    public function updateStatus(int $id): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)
            ->required('status')
            ->in('status', ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate', 'closed']);

        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        try {
            $updated = ComplaintService::updateStatus(
                $id,
                (string)$input['status'],
                (int)$admin['id'],
                $input['message'] ?? null,
                isset($input['is_public']) ? (bool)$input['is_public'] : true
            );

            jsonSuccess("Complaint status updated successfully.", $updated);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "STATUS_UPDATE_ERROR", 400);
        }
    }

    public function resolve(int $id): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)->required('resolution_notes');
        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422);
        }

        try {
            $updated = ComplaintService::resolveComplaint(
                $id,
                (string)$input['resolution_notes'],
                $input['photo_path'] ?? null,
                (int)$admin['id']
            );

            jsonSuccess("Complaint officially marked resolved.", $updated);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "RESOLUTION_ERROR", 400);
        }
    }

    public function reject(int $id): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)->required('reason');
        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422);
        }

        try {
            $updated = ComplaintService::rejectComplaint(
                $id,
                (string)$input['reason'],
                (int)$admin['id']
            );

            jsonSuccess("Complaint rejected.", $updated);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "REJECTION_ERROR", 400);
        }
    }

    public function duplicate(int $id): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $originalId = (int)($input['original_complaint_id'] ?? 0);
        $message = "Flagged as duplicate of complaint #{$originalId} by administrator.";

        try {
            $updated = ComplaintService::updateStatus($id, 'duplicate', (int)$admin['id'], $message, true);
            jsonSuccess("Complaint marked as duplicate.", $updated);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "DUPLICATE_ERROR", 400);
        }
    }

    public function auditLogs(): void {
        AdminMiddleware::handle();

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));

        $logs = AuditLog::getAll($page, $limit);
        jsonSuccess("Audit logs retrieved.", $logs['logs'], 200, [
            'page'        => $logs['page'],
            'limit'       => $logs['limit'],
            'total'       => $logs['total'],
            'total_pages' => $logs['total_pages']
        ]);
    }
}
