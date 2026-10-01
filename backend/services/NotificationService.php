<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Notification Service
 * Manages in-app notifications and architecture for external gateways (SMS, WhatsApp, Email).
 */

require_once __DIR__ . '/../models/Notification.php';
require_once __DIR__ . '/../config/environment.php';

class NotificationService {
    public static function send(
        int $userId,
        ?int $complaintId,
        string $type,
        string $title,
        string $message,
        string $channel = 'in_app'
    ): int {
        // Record notification in database
        $id = Notification::create($userId, $complaintId, $type, $title, $message, $channel);

        // Architectural dispatch hook for external channels
        if ($channel === 'email' && env('MAIL_HOST') && env('MAIL_USERNAME')) {
            self::dispatchEmail($userId, $title, $message);
        } elseif ($channel === 'sms' && env('SMS_API_KEY')) {
            self::dispatchSms($userId, $message);
        } elseif ($channel === 'whatsapp' && env('WHATSAPP_API_KEY')) {
            self::dispatchWhatsApp($userId, $message);
        }

        return $id;
    }

    private static function dispatchEmail(int $userId, string $subject, string $body): bool {
        // Mailer gateway integration
        return true;
    }

    private static function dispatchSms(int $userId, string $message): bool {
        // SMS gateway integration
        return true;
    }

    private static function dispatchWhatsApp(int $userId, string $message): bool {
        // WhatsApp Business API gateway integration
        return true;
    }
}
