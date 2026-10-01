<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Application Configuration Constants
 */

require_once __DIR__ . '/environment.php';

return [
    'name'        => 'ASR WATER & DRAINAGE',
    'tagline'     => 'Report. Track. Improve.',
    'district'    => 'Alluri Sitharama Raju',
    'state'       => 'Andhra Pradesh',
    'env'         => env('APP_ENV', 'development'),
    'url'         => env('APP_URL', 'http://localhost:3000'),
    'api_prefix'  => '/api/v1',
    'upload_dir'  => __DIR__ . '/../uploads',
    'max_upload'  => 5 * 1024 * 1024, // 5MB
    'languages'   => ['en', 'te'],
    
    // Core Workflow Statuses
    'statuses'    => [
        'submitted',
        'under_review',
        'assigned',
        'in_progress',
        'resolved',
        'rejected',
        'duplicate',
        'closed'
    ],

    // Priority Levels
    'priorities'  => [
        'low',
        'medium',
        'high',
        'critical'
    ],

    // User Roles
    'roles'       => [
        'citizen',
        'admin',
        'super_admin',
        'organization_admin'
    ],

    // Rate Limiting
    'rate_limit'  => [
        'requests_per_minute' => (int)env('RATE_LIMIT_PER_MINUTE', 120)
    ]
];
