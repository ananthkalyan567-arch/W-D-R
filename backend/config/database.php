<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Central Database Connection Singleton
 * Configures robust PDO instance with UTF8mb4 Telugu support and strict error handling.
 */

require_once __DIR__ . '/environment.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host     = env('DB_HOST', 'localhost');
            $port     = env('DB_PORT', '3306');
            $database = env('DB_DATABASE', 'asr_water_drainage');
            $username = env('DB_USERNAME', 'root');
            $password = env('DB_PASSWORD', '');

            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                // Log privately without exposing database credentials
                if (class_exists('Logger')) {
                    Logger::error("Database connection failure: " . $e->getMessage());
                }
                
                if (function_exists('jsonError')) {
                    jsonError("Database connection failed. Please ensure MySQL server is running and .env parameters are correct.", "DB_CONNECTION_ERROR", 500);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success'    => false,
                        'message'    => 'Database connection failed.',
                        'error_code' => 'DB_CONNECTION_ERROR'
                    ]);
                    exit;
                }
            }
        }

        return self::$instance;
    }
}
