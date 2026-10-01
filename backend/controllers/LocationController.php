<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - LocationController
 */

require_once __DIR__ . '/../services/LocationService.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/response.php';

class LocationController {
    public function index(): void {
        $activeOnly = !isset($_GET['all']) || $_GET['all'] !== 'true';
        $tree = LocationService::getTree($activeOnly);
        jsonSuccess("Locations hierarchy retrieved.", $tree);
    }

    public function show(int $id): void {
        $location = Location::findById($id);
        if (!$location) {
            jsonError("Location not found.", "LOCATION_NOT_FOUND", 404);
        }
        jsonSuccess("Location details retrieved.", $location);
    }

    public function create(): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)
            ->required('name')
            ->coordinates('latitude', 'longitude');

        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        try {
            $created = LocationService::createLocation($input, (int)$admin['id']);
            jsonSuccess("Location created successfully.", $created, 201);
        } catch (Exception $e) {
            jsonError("Failed to create location: " . $e->getMessage(), "INTERNAL_ERROR", 500);
        }
    }

    public function update(int $id): void {
        $admin = AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $updated = LocationService::updateLocation($id, $input, (int)$admin['id']);
            jsonSuccess("Location updated successfully.", $updated);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "LOCATION_UPDATE_ERROR", 400);
        }
    }

    public function delete(int $id): void {
        $admin = AdminMiddleware::handle();

        try {
            LocationService::disableLocation($id, (int)$admin['id']);
            jsonSuccess("Location deactivated successfully.");
        } catch (Exception $e) {
            jsonError($e->getMessage(), "LOCATION_DELETE_ERROR", 400);
        }
    }
}
