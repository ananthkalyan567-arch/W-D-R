<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - RainwaterController
 * Handles citizen rainwater reports, verification workflows, and admin rainwater management.
 */

require_once __DIR__ . '/../services/RainwaterService.php';
require_once __DIR__ . '/../models/RainwaterReport.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/security.php';
require_once __DIR__ . '/../helpers/response.php';

class RainwaterController {
    /**
     * Public / Citizen: Submit a rainwater report
     * Supports: YES (Available), NO (Not Available), NOT SURE workflows
     */
    public function create(): void {
        $user = AuthMiddleware::optional();
        $userId = $user ? (int)$user['id'] : null;

        $input = !empty($_POST) ? $_POST : (json_decode(file_get_contents('php://input'), true) ?? []);

        $v = Validator::make($input)
            ->required('location_id')
            ->coordinates('latitude', 'longitude');

        if (!empty($input['availability_status'])) {
            $v->in('availability_status', ['available', 'not_available', 'unknown']);
        }

        if (!empty($input['condition_status'])) {
            $v->in('condition_status', ['good', 'partially_blocked', 'blocked', 'damaged', 'unknown']);
        }

        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        // Handle Photo Upload
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

        $input['photo_path'] = $photoPath ?? ($input['photo_path'] ?? null);

        try {
            $result = RainwaterService::submitReport($input, $userId);
            jsonSuccess(
                "Rainwater report submitted successfully.",
                [
                    'report_number'        => $result['report']['report_number'],
                    'report_id'            => $result['report']['id'],
                    'availability_status'  => $result['report']['availability_status'],
                    'condition_status'     => $result['report']['condition_status'],
                    'verification_status'  => $result['report']['verification_status'],
                    'complaint_id'         => $result['complaint_id'],
                    'complaint_number'     => $result['complaint_number'],
                    'location'             => [
                        'id'   => $result['report']['location_id'],
                        'name' => $result['report']['location_name']
                    ],
                    'created_at'           => $result['report']['created_at']
                ],
                201
            );
        } catch (Throwable $e) {
            jsonError($e->getMessage(), "REPORT_SUBMISSION_FAILED", 400);
        }
    }

    /**
     * Public: List rainwater reports (paginated, filtered, privacy-sanitized)
     */
    public function index(): void {
        $filters = [
            'availability_status' => $_GET['availability_status'] ?? null,
            'condition_status'    => $_GET['condition_status'] ?? null,
            'verification_status' => $_GET['verification_status'] ?? null,
            'report_type'         => $_GET['report_type'] ?? null,
            'location_id'         => $_GET['location_id'] ?? null,
            'search'              => $_GET['search'] ?? null
        ];

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 15)));

        $reports = RainwaterReport::getAll($filters, $page, $limit);
        $total = RainwaterReport::countAll($filters);

        // Sanitize for public privacy
        $sanitized = array_map(function ($r) {
            unset($r['citizen_phone'], $r['citizen_email']);
            return $r;
        }, $reports);

        jsonSuccess("Rainwater reports fetched.", [
            'reports' => $sanitized,
            'pagination' => [
                'total'        => $total,
                'current_page' => $page,
                'per_page'     => $limit,
                'last_page'    => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Public: View single report details
     */
    public function show(int $id): void {
        $report = RainwaterReport::findById($id);
        if (!$report) {
            jsonError("Rainwater report not found.", "NOT_FOUND", 404);
        }

        // Privacy protection for public access
        $user = AuthMiddleware::optional();
        $isAdmin = $user && in_array($user['role'], ['admin', 'super_admin', 'organization_admin']);
        $isOwner = $user && ($user['id'] === $report['user_id']);

        if (!$isAdmin && !$isOwner) {
            unset($report['citizen_phone'], $report['citizen_email'], $report['verification_notes']);
        }

        jsonSuccess("Rainwater report retrieved.", $report);
    }

    /**
     * Citizen: View own submitted rainwater reports
     */
    public function myReports(): void {
        $user = AuthMiddleware::require();
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 15)));

        $filters = ['user_id' => $user['id']];
        $reports = RainwaterReport::getAll($filters, $page, $limit);
        $total = RainwaterReport::countAll($filters);

        jsonSuccess("My rainwater reports fetched.", [
            'reports' => $reports,
            'pagination' => [
                'total'        => $total,
                'current_page' => $page,
                'per_page'     => $limit,
                'last_page'    => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Public Map Points: Sanitized geo coordinates for map display
     */
    public function map(): void {
        $points = RainwaterReport::getMapPoints();
        jsonSuccess("Rainwater map points loaded.", [
            'total'  => count($points),
            'points' => $points
        ]);
    }

    /**
     * Admin: Full rainwater reports table
     */
    public function adminIndex(): void {
        $user = AuthMiddleware::requireRole(['admin', 'super_admin', 'organization_admin']);

        $filters = [
            'availability_status' => $_GET['availability_status'] ?? null,
            'condition_status'    => $_GET['condition_status'] ?? null,
            'verification_status' => $_GET['verification_status'] ?? null,
            'report_type'         => $_GET['report_type'] ?? null,
            'location_id'         => $_GET['location_id'] ?? null,
            'has_complaint'       => $_GET['has_complaint'] ?? null,
            'search'              => $_GET['search'] ?? null
        ];

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));

        $reports = RainwaterReport::getAll($filters, $page, $limit);
        $total = RainwaterReport::countAll($filters);

        jsonSuccess("Admin rainwater reports loaded.", [
            'reports' => $reports,
            'pagination' => [
                'total'        => $total,
                'current_page' => $page,
                'per_page'     => $limit,
                'last_page'    => ceil($total / $limit)
            ]
        ]);
    }

    /**
     * Admin: View complete report detail
     */
    public function adminShow(int $id): void {
        AuthMiddleware::requireRole(['admin', 'super_admin', 'organization_admin']);

        $report = RainwaterReport::findById($id);
        if (!$report) {
            jsonError("Rainwater report not found.", "NOT_FOUND", 404);
        }

        jsonSuccess("Admin report details retrieved.", $report);
    }

    /**
     * Admin: Verify Rainwater Report
     * Options: pending, verified, not_verified, rejected
     */
    public function verify(int $id): void {
        $admin = AuthMiddleware::requireRole(['admin', 'super_admin', 'organization_admin']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)
            ->required('verification_status')
            ->in('verification_status', ['pending', 'verified', 'not_verified', 'rejected']);

        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422);
        }

        try {
            $updated = RainwaterService::verifyReport(
                $id,
                $input['verification_status'],
                (int)$admin['id'],
                $input['verification_notes'] ?? null
            );
            jsonSuccess("Rainwater report verification status updated to {$input['verification_status']}.", $updated);
        } catch (Throwable $e) {
            jsonError($e->getMessage(), "VERIFICATION_FAILED", 400);
        }
    }

    /**
     * Admin: Update status / priority
     */
    public function updateStatus(int $id): void {
        $admin = AuthMiddleware::requireRole(['admin', 'super_admin', 'organization_admin']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $report = RainwaterReport::findById($id);
        if (!$report) {
            jsonError("Rainwater report not found.", "NOT_FOUND", 404);
        }

        $pdo = Database::getConnection();
        $fields = [];
        $params = [':id' => $id];

        if (!empty($input['availability_status'])) {
            $fields[] = "availability_status = :avail";
            $params[':avail'] = $input['availability_status'];
        }
        if (!empty($input['condition_status'])) {
            $fields[] = "condition_status = :cond";
            $params[':cond'] = $input['condition_status'];
        }
        if (!empty($input['admin_priority'])) {
            $fields[] = "admin_priority = :prio";
            $params[':prio'] = $input['admin_priority'];
        }

        if (!empty($fields)) {
            $sql = "UPDATE rainwater_reports SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        jsonSuccess("Rainwater report updated successfully.", RainwaterReport::findById($id));
    }

    /**
     * Admin: Assign linked complaint to organization / staff
     */
    public function assign(int $id): void {
        $admin = AuthMiddleware::requireRole(['admin', 'super_admin', 'organization_admin']);
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)->required('organization_id');
        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422);
        }

        try {
            $updated = RainwaterService::assignReport(
                $id,
                (int)$input['organization_id'],
                !empty($input['assigned_user_id']) ? (int)$input['assigned_user_id'] : null,
                (int)$admin['id'],
                $input['notes'] ?? null
            );
            jsonSuccess("Rainwater report complaint assigned successfully.", $updated);
        } catch (Throwable $e) {
            jsonError($e->getMessage(), "ASSIGNMENT_FAILED", 400);
        }
    }

    /**
     * Admin: Rainwater Analytics and KPI summary
     */
    public function analytics(): void {
        AuthMiddleware::requireRole(['admin', 'super_admin', 'organization_admin']);
        $analytics = RainwaterReport::getAnalytics();
        jsonSuccess("Rainwater analytics fetched.", $analytics);
    }
}
