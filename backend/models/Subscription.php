<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Subscription Model (Monetization Architecture)
 */

require_once __DIR__ . '/../config/database.php';

class Subscription {
    public static function getPlans(): array {
        $pdo = Database::getConnection();
        return $pdo->query("SELECT * FROM plans WHERE status = 'active' ORDER BY price_monthly ASC")->fetchAll();
    }

    public static function getOrgSubscription(int $organizationId): ?array {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT os.*, p.name as plan_name, p.code as plan_code, p.features 
                               FROM organization_subscriptions os 
                               JOIN plans p ON os.plan_id = p.id 
                               WHERE os.organization_id = :org_id 
                               ORDER BY os.created_at DESC LIMIT 1");
        $stmt->execute([':org_id' => $organizationId]);
        $sub = $stmt->fetch();
        return $sub ?: null;
    }
}
