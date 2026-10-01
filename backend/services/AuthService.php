<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Authentication Service
 * Manages registration, secure password hashing, tokens, and role security.
 */

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/AuditLog.php';
require_once __DIR__ . '/../helpers/security.php';

class AuthService {
    public static function register(array $data): array {
        // Enforce default citizen role. Never permit self-assignment of admin or super_admin!
        $data['role'] = 'citizen';
        $data['status'] = 'active';
        $data['password_hash'] = Security::hashPassword($data['password']);

        // Check duplicates
        if (!empty($data['email']) && User::findByEmail($data['email'])) {
            throw new InvalidArgumentException("A user with this email address already exists.");
        }
        if (!empty($data['phone']) && User::findByPhone($data['phone'])) {
            throw new InvalidArgumentException("A user with this mobile number already exists.");
        }

        $userId = User::create($data);
        $user = User::findById($userId);

        AuditLog::log($userId, 'USER_REGISTERED', 'users', $userId, null, ['email' => $data['email'] ?? null]);

        $token = self::generateTokenForUser($user);
        return ['user' => $user, 'token' => $token];
    }

    public static function login(string $identifier, string $password): array {
        // Support login by email OR mobile phone number
        $user = filter_var($identifier, FILTER_VALIDATE_EMAIL)
            ? User::findByEmail($identifier)
            : User::findByPhone($identifier);

        if (!$user) {
            throw new RuntimeException("Invalid credentials provided.");
        }

        if ($user['status'] === 'suspended') {
            throw new RuntimeException("This account has been suspended. Please contact platform administration.");
        }

        if ($user['status'] === 'inactive') {
            throw new RuntimeException("This account is currently inactive.");
        }

        if (!Security::verifyPassword($password, $user['password_hash'])) {
            throw new RuntimeException("Invalid credentials provided.");
        }

        User::updateLastLogin((int)$user['id']);
        AuditLog::log((int)$user['id'], 'USER_LOGIN', 'users', (int)$user['id']);

        $safeUser = User::toSafeArray($user);
        $token = self::generateTokenForUser($safeUser);

        return ['user' => $safeUser, 'token' => $token];
    }

    public static function generateTokenForUser(array $user): string {
        $secret = env('SESSION_SECRET', 'asr_default_key_change_me');
        $expiryHours = (int)env('TOKEN_EXPIRY_HOURS', 24);
        
        $payload = [
            'sub'   => $user['id'],
            'email' => $user['email'] ?? '',
            'role'  => $user['role'],
            'iat'   => time(),
            'exp'   => time() + ($expiryHours * 3600)
        ];

        $encodedPayload = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', $encodedPayload, $secret);

        return "{$encodedPayload}.{$signature}";
    }

    public static function validateToken(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 2) {
            return null;
        }

        [$encodedPayload, $providedSignature] = $parts;
        $secret = env('SESSION_SECRET', 'asr_default_key_change_me');
        $expectedSignature = hash_hmac('sha256', $encodedPayload, $secret);

        if (!hash_equals($expectedSignature, $providedSignature)) {
            return null;
        }

        $payload = json_decode(base64_decode($encodedPayload), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }
}
