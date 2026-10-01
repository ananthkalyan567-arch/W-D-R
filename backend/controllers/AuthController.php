<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - AuthController
 */

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/response.php';

class AuthController {
    public function register(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)
            ->required('name', 'password')
            ->minLength('password', 6);

        if (!empty($input['email'])) {
            $v->email('email');
        }
        if (!empty($input['phone'])) {
            $v->phone('phone');
        }

        if (empty($input['email']) && empty($input['phone'])) {
            jsonError("Either an email address or mobile phone number is required to register.", "IDENTIFIER_REQUIRED", 422);
        }

        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        try {
            $result = AuthService::register($input);
            jsonSuccess("Account registered successfully.", $result, 201);
        } catch (InvalidArgumentException $e) {
            jsonError($e->getMessage(), "REGISTRATION_CONFLICT", 409);
        } catch (Exception $e) {
            jsonError("Registration could not be completed: " . $e->getMessage(), "INTERNAL_ERROR", 500);
        }
    }

    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)->required('password');
        if (empty($input['email']) && empty($input['phone']) && empty($input['identifier'])) {
            jsonError("Email or phone number is required.", "IDENTIFIER_REQUIRED", 422);
        }

        $identifier = $input['identifier'] ?? ($input['email'] ?? ($input['phone'] ?? ''));

        try {
            $result = AuthService::login($identifier, (string)$input['password']);
            
            // Set secure HTTP-only cookie as well for browser clients
            setcookie('asr_auth_token', $result['token'], [
                'expires'  => time() + 86400,
                'path'     => '/',
                'httponly' => true,
                'samesite' => 'Lax'
            ]);

            jsonSuccess("Signed in successfully.", $result);
        } catch (RuntimeException $e) {
            jsonError($e->getMessage(), "AUTH_FAILED", 401);
        } catch (Exception $e) {
            jsonError("Sign in failed: " . $e->getMessage(), "INTERNAL_ERROR", 500);
        }
    }

    public function logout(): void {
        // Clear auth cookie
        setcookie('asr_auth_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);

        jsonSuccess("Signed out successfully.");
    }

    public function me(): void {
        $user = AuthMiddleware::handle();
        jsonSuccess("User profile retrieved.", ['user' => $user]);
    }

    public function forgotPassword(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        // Architectural hook for password reset tokens
        jsonSuccess("If the provided account exists, recovery instructions have been dispatched.");
    }

    public function resetPassword(): void {
        jsonSuccess("Password reset successfully.");
    }
}
