<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Rate Limiting Middleware
 * Protects endpoints from abuse using sliding window IP tracking.
 */

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/environment.php';

class RateLimitMiddleware {
    private static string $storageDir = __DIR__ . '/../logs/ratelimit';

    public static function handle(int $maxPerMinute = 120): void {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $key = md5($ip);

        if (!is_dir(self::$storageDir)) {
            mkdir(self::$storageDir, 0755, true);
        }

        $file = self::$storageDir . '/' . $key . '.json';
        $now = time();
        $window = 60; // 60 seconds

        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : ['count' => 0, 'start' => $now];

        if (($now - $data['start']) > $window) {
            $data = ['count' => 1, 'start' => $now];
        } else {
            $data['count']++;
        }

        file_put_contents($file, json_encode($data), LOCK_EX);

        header("X-RateLimit-Limit: {$maxPerMinute}");
        header("X-RateLimit-Remaining: " . max(0, $maxPerMinute - $data['count']));

        if ($data['count'] > $maxPerMinute) {
            header('Retry-After: 60');
            jsonError("Rate limit exceeded. Please wait a moment before sending more requests.", "RATE_LIMIT_EXCEEDED", 429);
        }
    }
}
