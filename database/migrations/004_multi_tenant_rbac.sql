-- =====================================================
-- Migration 004: Multi-tenant RBAC
-- Adds Role + AdminId scoping + PatientProfessional pivot
-- =====================================================

-- 1. Create user_role enum type (MySQL ENUM via ALTER)
-- Add role and professional_id columns to user table
USE podiatry_db;


ALTER TABLE `user`
  ADD COLUMN `role` ENUM('admin', 'professional') NOT NULL DEFAULT 'admin' AFTER `professional_name`,
  ADD COLUMN `professional_id` VARCHAR(36) NULL AFTER `role`,
  ADD UNIQUE INDEX `user_professional_id_key` (`professional_id`),
  ADD CONSTRAINT `user_professional_id_fkey`
    FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Add admin_id to patient table
ALTER TABLE `patient`
  ADD COLUMN `admin_id` VARCHAR(36) NOT NULL AFTER `id`,
  ADD INDEX `idx_patient_admin` (`admin_id`);

-- 3. Add admin_id to professional table
ALTER TABLE `professional`
  ADD COLUMN `admin_id` VARCHAR(36) NOT NULL AFTER `id`,
  ADD INDEX `idx_professional_admin` (`admin_id`);

-- 4. Create patient_professional pivot table
CREATE TABLE IF NOT EXISTS `patient_professional` (
  `patient_id` VARCHAR(36) NOT NULL,
  `professional_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_id`, `professional_id`),
  INDEX `idx_patient_professional_prof` (`professional_id`),
  CONSTRAINT `patient_professional_patient_fkey`
    FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_professional_professional_fkey`
    FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 5. Backfill admin_id with the first admin user's id
-- (assumes the first user created is the admin)
SET @admin_id = (SELECT `id` FROM `user` ORDER BY `created_at` ASC LIMIT 1);

UPDATE `patient` SET `admin_id` = @admin_id WHERE `admin_id` = '';
UPDATE `professional` SET `admin_id` = @admin_id WHERE `admin_id` = '';
