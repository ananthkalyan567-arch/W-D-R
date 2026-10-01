<?php
/**
 * ASR Water & Drainage - Database Connection Configuration
 * Uses PHP Data Objects (PDO) with prepared statements for SQL-injection protection.
 */

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'asr_water_drainage');
define('DB_USER', 'root');
define('DB_PASS', '');

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // In production, log error privately without leaking credentials to client
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed. Please ensure MySQL is running.',
                    'error'   => $e->getMessage()
                ]);
                exit;
            }
        }

        return self::$instance;
    }
}
