<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Standardized API Response Helper
 * Enforces uniform JSON response envelope across all endpoints.
 */

if (!function_exists('jsonResponse')) {
    function jsonResponse(array $payload, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('jsonSuccess')) {
    function jsonSuccess(string $message, mixed $data = null, int $statusCode = 200, ?array $pagination = null): void {
        $response = [
            'success'   => true,
            'message'   => $message,
            'data'      => $data ?? new stdClass(),
            'timestamp' => date('c')
        ];

        if ($pagination !== null) {
            $response['pagination'] = $pagination;
        }

        jsonResponse($response, $statusCode);
    }
}

if (!function_exists('jsonError')) {
    function jsonError(string $message, string $errorCode = 'BAD_REQUEST', int $statusCode = 400, mixed $details = null): void {
        $response = [
            'success'    => false,
            'message'    => $message,
            'error_code' => $errorCode,
            'timestamp'  => date('c')
        ];

        if ($details !== null) {
            $response['details'] = $details;
        }

        jsonResponse($response, $statusCode);
    }
}
