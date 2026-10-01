-- ==============================================================================
-- MIGRATION: 002_add_rainwater_module.sql
-- ASR WATER & DRAINAGE: Rainwater Drip & Drainage Management Module
-- Safe migration: preserves all existing users, locations, and complaints.
-- ==============================================================================

USE `asr_water_drainage`;

-- 1. Extend category type to support 'rainwater'
ALTER TABLE `categories` 
MODIFY COLUMN `type` ENUM('water', 'drainage', 'rainwater') NOT NULL;

-- 2. Create rainwater_reports table
CREATE TABLE IF NOT EXISTS `rainwater_reports` (
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

-- 3. Seed initial Rainwater categories
INSERT INTO `categories` (`name`, `name_te`, `type`, `description`, `status`) VALUES
('Rainwater Drip/Drainage Opening Not Available', 'వర్షపు నీటి డ్రిప్/డ్రైనేజీ మార్గం అందుబాటులో లేదు', 'rainwater', 'No suitable rainwater drip hole or drainage opening exists at the location', 'active'),
('Rainwater Opening Blocked', 'వర్షపు నీటి మార్గం మూసుకుపోయింది', 'rainwater', 'Existing rainwater drainage opening choked with debris, silt or garbage', 'active'),
('Rainwater Opening Damaged', 'వర్షపు నీటి మార్గం దెబ్బతింది', 'rainwater', 'Broken slab, collapsed inlet grating or damaged drip channel', 'active'),
('Rainwater Overflow', 'వర్షపు నీరు పొంగిపొర్లడం', 'rainwater', 'Heavy runoff overflowing onto walkways, roads or surrounding premises', 'active'),
('Rainwater Waterlogging', 'వర్షపు నీరు నిలిచిపోవడం / ముంపు', 'rainwater', 'Stagnant rainwater puddles causing inconvenience and health concerns', 'active'),
('Rainwater Path Blocked', 'వర్షపు నీటి ప్రవాహ మార్గానికి అడ్డంకి', 'rainwater', 'Obstruction or construction blocking natural rainwater storm path', 'active'),
('Rainwater Collection Problem', 'వర్షపు నీటి నిల్వ సమస్య', 'rainwater', 'Failure or absence of community rainwater harvesting or collection point', 'active'),
('Drainage Connection Problem', 'డ్రైనేజీ అనుసంధాన సమస్య', 'rainwater', 'Rainwater opening not properly connected to storm drain network', 'active'),
('Other Rainwater Issue', 'ఇతర వర్షపు నీటి సమస్య', 'rainwater', 'Any other observation regarding rainwater drainage or drip opening', 'active');
