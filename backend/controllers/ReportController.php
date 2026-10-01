<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - ReportController
 */

require_once __DIR__ . '/../services/ReportService.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';

class ReportController {
    public function exportCsv(): void {
        AdminMiddleware::handle();

        $filters = [
            'status'        => $_GET['status'] ?? null,
            'priority'      => $_GET['priority'] ?? null,
            'location_id'   => $_GET['location_id'] ?? null,
            'category_type' => $_GET['type'] ?? null,
            'date_from'     => $_GET['date_from'] ?? null,
            'date_to'       => $_GET['date_to'] ?? null
        ];

        $csv = ReportService::generateComplaintsCsv($filters);

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="asr_complaints_report_' . date('Ymd_His') . '.csv"');
        echo $csv;
        exit;
    }
}
