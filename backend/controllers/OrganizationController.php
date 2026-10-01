<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - OrganizationController
 */

require_once __DIR__ . '/../models/Organization.php';
require_once __DIR__ . '/../models/Complaint.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../middleware/OrganizationMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/response.php';

class OrganizationController {
    public function index(): void {
        $activeOnly = !isset($_GET['all']) || $_GET['all'] !== 'true';
        $orgs = Organization::getAll($activeOnly);
        jsonSuccess("Organizations retrieved.", $orgs);
    }

    public function show(int $id): void {
        AdminMiddleware::handle();
        $org = Organization::findById($id);
        if (!$org) {
            jsonError("Organization not found.", "ORG_NOT_FOUND", 404);
        }

        $org['members'] = Organization::getUsers($id);
        jsonSuccess("Organization details retrieved.", $org);
    }

    public function create(): void {
        AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)->required('name');
        if (!empty($input['contact_email'])) {
            $v->email('contact_email');
        }
        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        try {
            $id = Organization::create($input);
            $org = Organization::findById($id);
            jsonSuccess("Organization created successfully.", $org, 201);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "ORG_CREATE_ERROR", 500);
        }
    }

    public function update(int $id): void {
        AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            Organization::update($id, $input);
            $org = Organization::findById($id);
            jsonSuccess("Organization updated successfully.", $org);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "ORG_UPDATE_ERROR", 400);
        }
    }

    public function addUser(int $id): void {
        AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)->required('user_id');
        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422);
        }

        try {
            Organization::addUser($id, (int)$input['user_id'], $input['role'] ?? 'field_agent');
            jsonSuccess("User linked to organization successfully.");
        } catch (Exception $e) {
            jsonError($e->getMessage(), "ORG_USER_ERROR", 400);
        }
    }

    public function myComplaints(): void {
        $context = OrganizationMiddleware::handle();
        $orgId = $context['org_id'];

        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

        $filters = [
            'assigned_organization_id' => $orgId,
            'status'                   => $_GET['status'] ?? null,
            'priority'                 => $_GET['priority'] ?? null
        ];

        $result = Complaint::getAll($filters, $page, $limit);
        jsonSuccess("Assigned organization complaints retrieved.", $result['complaints'], 200, [
            'page'        => $result['page'],
            'limit'       => $result['limit'],
            'total'       => $result['total'],
            'total_pages' => $result['total_pages']
        ]);
    }
}
