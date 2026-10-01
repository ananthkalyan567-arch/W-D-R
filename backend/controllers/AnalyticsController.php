<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - AnalyticsController
 */

require_once __DIR__ . '/../services/AnalyticsService.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../helpers/response.php';

class AnalyticsController {
    public function index(): void {
        AdminMiddleware::handle();
        $locationId = !empty($_GET['location_id']) ? (int)$_GET['location_id'] : null;
        $summary = AnalyticsService::getSummary($locationId);
        jsonSuccess("Analytics summary retrieved.", $summary);
    }

    public function trends(): void {
        AdminMiddleware::handle();
        $days = max(7, min(365, (int)($_GET['days'] ?? 30)));
        $trends = AnalyticsService::getTrends($days);
        jsonSuccess("Complaint trends retrieved.", $trends);
    }

    public function categories(): void {
        AdminMiddleware::handle();
        $cats = AnalyticsService::getCategoriesBreakdown();
        jsonSuccess("Category breakdown retrieved.", $cats);
    }

    public function locations(): void {
        AdminMiddleware::handle();
        $locs = AnalyticsService::getLocationsBreakdown();
        jsonSuccess("Locations breakdown retrieved.", $locs);
    }

    public function status(): void {
        AdminMiddleware::handle();
        $stats = AnalyticsService::getStatusDistribution();
        jsonSuccess("Status distribution retrieved.", $stats);
    }

    public function resolutionTime(): void {
        AdminMiddleware::handle();
        $metrics = AnalyticsService::getResolutionTimeMetrics();
        jsonSuccess("Resolution time metrics retrieved.", $metrics);
    }
}
