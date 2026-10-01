<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Environment Configuration Loader
 * Parses .env files and loads key-value pairs into getenv() and $_ENV.
 */

class Environment {
    private static array $variables = [];
    private static bool $loaded = false;

    public static function load(string $path): void {
        if (self::$loaded) return;

        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || str_starts_with($line, '#')) {
                    continue;
                }

                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $val = trim($parts[1]);
                    // Strip optional quotes
                    $val = trim($val, '"\'');
                    self::$variables[$key] = $val;
                    putenv("{$key}={$val}");
                    $_ENV[$key] = $val;
                }
            }
        }
        self::$loaded = true;
    }

    public static function get(string $key, mixed $default = null): mixed {
        if (isset(self::$variables[$key])) {
            return self::$variables[$key];
        }
        $val = getenv($key);
        if ($val !== false) {
            return $val;
        }
        return $default;
    }
}

if (!function_exists('env')) {
    function env(string $key, mixed $default = null): mixed {
        return Environment::get($key, $default);
    }
}
