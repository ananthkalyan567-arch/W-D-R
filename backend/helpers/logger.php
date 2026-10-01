<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Central Application Logger
 * Logs system events, security errors, and administrative actions.
 */

class Logger {
    private static string $logDir = __DIR__ . '/../logs';

    private static function ensureLogDir(): void {
        if (!is_dir(self::$logDir)) {
            mkdir(self::$logDir, 0755, true);
        }
    }

    private static function write(string $file, string $level, string $message, array $context = []): void {
        self::ensureLogDir();
        $date = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'CLI';
        $contextStr = !empty($context) ? ' ' . json_encode($context, JSON_UNESCAPED_SLASHES) : '';
        $entry = "[{$date}] [{$level}] [IP: {$ip}] {$message}{$contextStr}" . PHP_EOL;
        
        file_put_contents(self::$logDir . '/' . $file, $entry, FILE_APPEND | LOCK_EX);
    }

    public static function info(string $message, array $context = []): void {
        self::write('app.log', 'INFO', $message, $context);
    }

    public static function warning(string $message, array $context = []): void {
        self::write('app.log', 'WARNING', $message, $context);
    }

    public static function error(string $message, array $context = []): void {
        self::write('error.log', 'ERROR', $message, $context);
    }

    public static function audit(int $userId, string $action, array $details = []): void {
        self::write('audit.log', 'AUDIT', "User {$userId} performed: {$action}", $details);
    }
}
