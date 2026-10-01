-- ==============================================================================
-- ASR WATER & DRAINAGE (ASR-WD) - PRODUCTION DATABASE SCHEMA
-- Target Database: MySQL 8.0+
-- Region: Alluri Sitharama Raju (ASR) District, Andhra Pradesh, India
-- Charset: utf8mb4 (Telugu and English Full Multilingual Support)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `asr_water_drainage`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `asr_water_drainage`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- Roles: citizen, admin, super_admin, organization_admin
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) UNIQUE DEFAULT NULL,
  `phone` VARCHAR(25) UNIQUE DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('citizen', 'admin', 'super_admin', 'organization_admin') NOT NULL DEFAULT 'citizen',
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `preferred_language` ENUM('en', 'te') NOT NULL DEFAULT 'en',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. LOCATIONS TABLE (Flexible Multi-tier Hierarchy)
-- Supports District -> Mandal -> Village/Locality -> Ward
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `locations`;
CREATE TABLE `locations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `name_te` VARCHAR(180) DEFAULT NULL,
  `parent_id` INT UNSIGNED DEFAULT NULL,
  `location_type` ENUM('district', 'mandal', 'locality', 'ward') NOT NULL DEFAULT 'mandal',
  `latitude` DECIMAL(10, 7) DEFAULT NULL,
  `longitude` DECIMAL(10, 7) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_locations_parent` (`parent_id`),
  KEY `idx_locations_type` (`location_type`),
  KEY `idx_locations_status` (`status`),
  CONSTRAINT `fk_locations_parent` FOREIGN KEY (`parent_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES TABLE (Water & Drainage Problem Catalog)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `name_te` VARCHAR(180) DEFAULT NULL,
  `type` ENUM('water', 'drainage', 'rainwater') NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_categories_type` (`type`),
  KEY `idx_categories_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. ORGANIZATIONS TABLE (Participating Departments & Civic Maintenance Teams)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(160) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `organization_type` VARCHAR(100) DEFAULT 'Civic Maintenance',
  `contact_email` VARCHAR(150) DEFAULT NULL,
  `contact_phone` VARCHAR(25) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_org_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. ORGANIZATION_USERS TABLE (Authorization Binding)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `organization_users`;
CREATE TABLE `organization_users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` VARCHAR(60) NOT NULL DEFAULT 'field_agent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_org_user` (`organization_id`, `user_id`),
  CONSTRAINT `fk_org_users_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_org_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. COMPLAINTS TABLE (Core Civic Grievance Repository)
-- Human-readable format: ASR-WD-000001
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `complaints`;
CREATE TABLE `complaints` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `complaint_number` VARCHAR(30) UNIQUE NOT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `location_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `landmark` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10, 7) DEFAULT NULL,
  `longitude` DECIMAL(10, 7) DEFAULT NULL,
  `photo_path` VARCHAR(255) DEFAULT NULL,
  `citizen_severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `system_priority` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `ai_category` VARCHAR(120) DEFAULT NULL,
  `ai_priority` VARCHAR(30) DEFAULT NULL,
  `status` ENUM('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate', 'closed') NOT NULL DEFAULT 'submitted',
  `assigned_organization_id` INT UNSIGNED DEFAULT NULL,
  `assigned_user_id` INT UNSIGNED DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `resolution_notes` TEXT DEFAULT NULL,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `closed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_complaints_number` (`complaint_number`),
  KEY `idx_complaints_user` (`user_id`),
  KEY `idx_complaints_location` (`location_id`),
  KEY `idx_complaints_category` (`category_id`),
  KEY `idx_complaints_status` (`status`),
  KEY `idx_complaints_priority` (`system_priority`),
  KEY `idx_complaints_assigned_org` (`assigned_organization_id`),
  KEY `idx_complaints_created` (`created_at`),
  CONSTRAINT `fk_comp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_comp_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_comp_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_comp_org` FOREIGN KEY (`assigned_organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_comp_assigned_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. COMPLAINT_UPDATES TABLE (Timeline Audit Trail)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `complaint_updates`;
CREATE TABLE `complaint_updates` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `old_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `is_public` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_updates_complaint` (`complaint_id`),
  KEY `idx_updates_created` (`created_at`),
  CONSTRAINT `fk_updates_comp` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_updates_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. ASSIGNMENTS TABLE (Historical Assignment Trail)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `assignments`;
CREATE TABLE `assignments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `complaint_id` INT UNSIGNED NOT NULL,
  `organization_id` INT UNSIGNED NOT NULL,
  `assigned_user_id` INT UNSIGNED DEFAULT NULL,
  `assigned_by` INT UNSIGNED NOT NULL,
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `unassigned_at` TIMESTAMP NULL DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('active', 'reassigned', 'completed', 'canceled') NOT NULL DEFAULT 'active',
  KEY `idx_assignments_comp` (`complaint_id`),
  KEY `idx_assignments_org` (`organization_id`),
  CONSTRAINT `fk_assign_comp` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assign_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assign_user` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assign_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8B. RAINWATER_REPORTS TABLE (Rainwater Drip & Drainage Infrastructure Monitoring)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `rainwater_reports`;
CREATE TABLE `rainwater_reports` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `report_number` VARCHAR(30) NOT NULL UNIQUE,
  `complaint_id` BIGINT UNSIGNED DEFAULT NULL,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `location_id` INT UNSIGNED NOT NULL,
  `report_type` ENUM(
    'opening_available',
    'opening_not_available',
    'opening_blocked',
    'opening_damaged',
    'rainwater_overflow',
    'waterlogging',
    'rainwater_path_blocked',
    'collection_problem',
    'drainage_connection_problem',
    'other'
  ) NOT NULL DEFAULT 'opening_available',
  `availability_status` ENUM('available', 'not_available', 'unknown') NOT NULL DEFAULT 'unknown',
  `condition_status` ENUM('good', 'partially_blocked', 'blocked', 'damaged', 'unknown') NOT NULL DEFAULT 'unknown',
  `verification_status` ENUM('pending', 'verified', 'not_verified', 'rejected') NOT NULL DEFAULT 'pending',
  `description` TEXT DEFAULT NULL,
  `landmark` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10, 7) DEFAULT NULL,
  `longitude` DECIMAL(10, 7) DEFAULT NULL,
  `photo_path` VARCHAR(255) DEFAULT NULL,
  `video_path` VARCHAR(255) DEFAULT NULL,
  `citizen_severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `admin_priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT NULL,
  `verified_by` BIGINT UNSIGNED DEFAULT NULL,
  `verified_at` DATETIME DEFAULT NULL,
  `verification_notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_rw_location` (`location_id`),
  KEY `idx_rw_avail` (`availability_status`),
  KEY `idx_rw_cond` (`condition_status`),
  KEY `idx_rw_verif` (`verification_status`),
  KEY `idx_rw_created` (`created_at`),
  KEY `idx_rw_complaint` (`complaint_id`),
  KEY `idx_rw_type` (`report_type`),
  CONSTRAINT `fk_rw_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_rw_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rw_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rw_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS TABLE (Multi-Channel Notifications)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `complaint_id` INT UNSIGNED DEFAULT NULL,
  `type` VARCHAR(60) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `channel` ENUM('in_app', 'email', 'sms', 'whatsapp') NOT NULL DEFAULT 'in_app',
  `status` ENUM('pending', 'sent', 'failed', 'read') NOT NULL DEFAULT 'pending',
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_status` (`status`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_comp` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. AUDIT_LOGS TABLE (Immutable Administrative Security Record)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(60) NOT NULL,
  `entity_id` INT UNSIGNED NOT NULL,
  `old_values` JSON DEFAULT NULL,
  `new_values` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. MONETIZATION ARCHITECTURE TABLES (Section 38)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `plans`;
CREATE TABLE `plans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) UNIQUE NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price_monthly` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `price_annual` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `features` JSON DEFAULT NULL,
  `status` ENUM('active', 'archived') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'past_due', 'canceled', 'trialing') NOT NULL DEFAULT 'active',
  `current_period_start` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `current_period_end` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sub_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `organization_subscriptions`;
CREATE TABLE `organization_subscriptions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `organization_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'past_due', 'canceled', 'trialing') NOT NULL DEFAULT 'active',
  `current_period_start` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `current_period_end` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_org_sub_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_org_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subscription_id` INT UNSIGNED DEFAULT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `gateway` VARCHAR(50) NOT NULL DEFAULT 'manual',
  `transaction_ref` VARCHAR(120) UNIQUE NOT NULL,
  `status` ENUM('pending', 'succeeded', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pay_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `subscription_id` INT UNSIGNED DEFAULT NULL,
  `invoice_number` VARCHAR(60) UNIQUE NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('draft', 'open', 'paid', 'uncollectible', 'void') NOT NULL DEFAULT 'paid',
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_inv_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. AI ASSISTANT TABLES (Section 39 - Jala Mitra AI Assistant)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_feedback`;
DROP TABLE IF EXISTS `ai_messages`;
DROP TABLE IF EXISTS `ai_conversations`;
DROP TABLE IF EXISTS `ai_settings`;

CREATE TABLE `ai_conversations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `title` VARCHAR(255) DEFAULT NULL,
  `context_data` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_ai_session` (`session_id`),
  KEY `idx_ai_user` (`user_id`),
  CONSTRAINT `fk_ai_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_messages` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender` ENUM('user', 'assistant') NOT NULL,
  `message` TEXT NOT NULL,
  `category` VARCHAR(60) DEFAULT NULL,
  `suggested_priority` VARCHAR(30) DEFAULT NULL,
  `intent` VARCHAR(60) DEFAULT NULL,
  `entities` JSON DEFAULT NULL,
  `actions` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_ai_conv` (`conversation_id`),
  KEY `idx_ai_category` (`category`),
  KEY `idx_ai_priority` (`suggested_priority`),
  KEY `idx_ai_sender` (`sender`),
  CONSTRAINT `fk_ai_messages_conv` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_feedback` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `message_id` BIGINT UNSIGNED DEFAULT NULL,
  `conversation_id` BIGINT UNSIGNED DEFAULT NULL,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `rating` ENUM('helpful', 'not_helpful') NOT NULL,
  `reason` VARCHAR(100) DEFAULT NULL,
  `comments` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_ai_feedback_rating` (`rating`),
  CONSTRAINT `fk_ai_fb_msg` FOREIGN KEY (`message_id`) REFERENCES `ai_messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ai_fb_conv` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ai_fb_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ai_settings` (
  `setting_key` VARCHAR(80) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ai_settings` (`setting_key`, `setting_value`, `description`) VALUES
('ai_assistant_enabled', 'true', 'Master toggle for floating AI Assistant across the platform'),
('telugu_support_enabled', 'true', 'Toggle native Telugu NLP understanding and responses'),
('ai_provider', 'none', 'External AI provider: none | gemini | openai'),
('ai_model', 'gemini-1.5-flash', 'AI Model name when provider is configured'),
('fallback_mode_enabled', 'true', 'Intelligent local rule-based knowledge engine when API provider is offline')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

SET FOREIGN_KEY_CHECKS = 1;
