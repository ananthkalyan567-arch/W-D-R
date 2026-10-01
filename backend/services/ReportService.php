<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Report Generation Service
 * Produces structured data exports and CSV generation for administrative audits.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Complaint.php';

class ReportService {
    public static function generateComplaintsCsv(array $filters = []): string {
        $result = Complaint::getAll($filters, 1, 5000);
        $complaints = $result['complaints'];

        $fp = fopen('php://temp', 'r+');

        // CSV Header Row
        fputcsv($fp, [
            'Complaint Number',
            'Date Logged',
            'Mandal / Area',
            'Category',
            'Type',
            'Title',
            'Description',
            'Citizen Severity',
            'System Priority',
            'Status',
            'Assigned Department',
            'Resolution Notes',
            'Resolved Date'
        ]);

        foreach ($complaints as $c) {
            fputcsv($fp, [
                $c['complaint_number'],
                $c['created_at'],
                $c['location_name'] ?? 'Unspecified',
                $c['category_name'] ?? 'Unspecified',
                $c['category_type'] ?? 'water',
                $c['title'],
                $c['description'],
                $c['citizen_severity'],
                $c['system_priority'],
                $c['status'],
                $c['assigned_organization_name'] ?? 'Unassigned',
                $c['resolution_notes'] ?? '',
                $c['resolved_at'] ?? ''
            ]);
        }

        rewind($fp);
        $csv = stream_get_contents($fp);
        fclose($fp);

        return $csv;
    }
}
