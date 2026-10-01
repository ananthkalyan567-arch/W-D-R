<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Location Service
 */

require_once __DIR__ . '/../models/Location.php';
require_once __DIR__ . '/../models/AuditLog.php';

class LocationService {
    public static function getTree(bool $activeOnly = true): array {
        return Location::getTree($activeOnly);
    }

    public static function createLocation(array $data, int $adminUserId): array {
        $id = Location::create($data);
        AuditLog::log($adminUserId, 'LOCATION_CREATED', 'locations', $id, null, ['name' => $data['name']]);
        return Location::findById($id);
    }

    public static function updateLocation(int $id, array $data, int $adminUserId): array {
        $current = Location::findById($id);
        if (!$current) {
            throw new RuntimeException("Location not found.");
        }

        Location::update($id, $data);
        AuditLog::log($adminUserId, 'LOCATION_UPDATED', 'locations', $id, $current, $data);
        return Location::findById($id);
    }

    public static function disableLocation(int $id, int $adminUserId): bool {
        // Enforce soft deletion/disabling so historical complaints are never orphaned
        Location::toggleStatus($id, 'inactive');
        AuditLog::log($adminUserId, 'LOCATION_DISABLED', 'locations', $id);
        return true;
    }
}
