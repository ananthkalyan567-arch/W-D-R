-- ==============================================================================
-- MIGRATION: 003_add_ai_assistant_tables.sql
-- ASR WATER & DRAINAGE: AI Water, Drainage & Rainwater Assistant ("Jala Mitra")
-- Creates conversation history, messages, feedback, and settings tables.
-- Safe migration: Preserves all existing tables and data.
-- ==============================================================================

USE `asr_water_drainage`;

-- ------------------------------------------------------------------------------
-- 1. AI CONVERSATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_conversations` (
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

-- ------------------------------------------------------------------------------
-- 2. AI MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_messages` (
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

-- ------------------------------------------------------------------------------
-- 3. AI FEEDBACK TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_feedback` (
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

-- ------------------------------------------------------------------------------
-- 4. AI SETTINGS & CONFIGURATION TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_settings` (
  `setting_key` VARCHAR(80) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default AI settings
INSERT INTO `ai_settings` (`setting_key`, `setting_value`, `description`) VALUES
('ai_assistant_enabled', 'true', 'Master toggle for floating AI Assistant across the platform'),
('telugu_support_enabled', 'true', 'Toggle native Telugu NLP understanding and responses'),
('ai_provider', 'none', 'External AI provider: none | gemini | openai'),
('ai_model', 'gemini-1.5-flash', 'AI Model name when provider is configured'),
('fallback_mode_enabled', 'true', 'Intelligent local rule-based knowledge engine when API provider is offline')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
