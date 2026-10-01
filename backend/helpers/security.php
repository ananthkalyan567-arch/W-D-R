<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Security Utilities Helper
 * Hashing, Token generation, CSRF validation, and Secure File Upload Sanitization.
 */

class Security {
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }

    public static function generateToken(int $length = 32): string {
        return bin2hex(random_bytes($length));
    }

    public static function sanitize(mixed $value): mixed {
        if (is_array($value)) {
            return array_map([self::class, 'sanitize'], $value);
        }
        if (is_string($value)) {
            return htmlspecialchars(trim($value), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }
        return $value;
    }

    public static function validateUploadedFile(
        array $file,
        array $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
        int $maxSizeBytes = 5242880 // 5MB
    ): array {
        if (!isset($file['error']) || is_array($file['error'])) {
            return ['valid' => false, 'error' => 'Invalid file upload parameters.'];
        }

        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                return ['valid' => false, 'error' => 'No file was uploaded.'];
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return ['valid' => false, 'error' => 'Uploaded file exceeds allowed server size limit.'];
            default:
                return ['valid' => false, 'error' => 'Unknown upload error.'];
        }

        if ($file['size'] > $maxSizeBytes) {
            return ['valid' => false, 'error' => 'File size exceeds maximum limit of 5MB.'];
        }

        // Verify true MIME type using finfo (do not trust user submitted $_FILES['type'])
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        if (!in_array($mime, $allowedMimes, true)) {
            return ['valid' => false, 'error' => 'Invalid file format. Only JPG, PNG, and WEBP image formats are permitted.'];
        }

        $extensionMap = [
            'image/jpeg' => 'jpg',
            'image/pjpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];

        $safeExtension = $extensionMap[$mime] ?? 'bin';
        $safeName = 'comp_' . date('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.' . $safeExtension;

        return [
            'valid'     => true,
            'safe_name' => $safeName,
            'mime'      => $mime,
            'size'      => $file['size']
        ];
    }
}
