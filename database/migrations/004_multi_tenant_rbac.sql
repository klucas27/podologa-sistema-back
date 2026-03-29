-- ============================================================
-- Migration 004: Multi-tenant RBAC (Admin → Professional → Patient)
-- ============================================================

-- 1) Add role and admin_id to user table
ALTER TABLE `user`
  ADD COLUMN `role` ENUM('admin','professional') NOT NULL DEFAULT 'admin' AFTER `professional_name`,
  ADD COLUMN `admin_id` VARCHAR(36) NULL AFTER `role`;

ALTER TABLE `user`
  ADD INDEX `idx_user_admin_id` (`admin_id`),
  ADD CONSTRAINT `fk_user_admin` FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Add admin_id to professional table
ALTER TABLE `professional`
  ADD COLUMN `admin_id` VARCHAR(36) NOT NULL AFTER `is_active`;

-- Backfill: assign existing professionals to the first admin user
-- (adjust as needed based on your data)
UPDATE `professional` p
  SET p.`admin_id` = (SELECT u.`id` FROM `user` u WHERE u.`deleted_at` IS NULL ORDER BY u.`created_at` ASC LIMIT 1)
  WHERE p.`admin_id` = '' OR p.`admin_id` IS NULL;

ALTER TABLE `professional`
  ADD INDEX `idx_professional_admin_id` (`admin_id`),
  ADD CONSTRAINT `fk_professional_admin` FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3) Add admin_id to patient table
ALTER TABLE `patient`
  ADD COLUMN `admin_id` VARCHAR(36) NOT NULL AFTER `state`;

-- Backfill: assign existing patients to the first admin user
UPDATE `patient` p
  SET p.`admin_id` = (SELECT u.`id` FROM `user` u WHERE u.`deleted_at` IS NULL ORDER BY u.`created_at` ASC LIMIT 1)
  WHERE p.`admin_id` = '' OR p.`admin_id` IS NULL;

ALTER TABLE `patient`
  ADD INDEX `idx_patient_admin_id` (`admin_id`),
  ADD CONSTRAINT `fk_patient_admin` FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4) Create patient_professional pivot table (N:N)
CREATE TABLE IF NOT EXISTS `patient_professional` (
  `patient_id`      VARCHAR(36) NOT NULL,
  `professional_id` VARCHAR(36) NOT NULL,
  `created_at`      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`patient_id`, `professional_id`),
  INDEX `idx_patient_professional_prof` (`professional_id`),

  CONSTRAINT `fk_pp_patient`
    FOREIGN KEY (`patient_id`) REFERENCES `patient`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_pp_professional`
    FOREIGN KEY (`professional_id`) REFERENCES `professional`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Mark all existing users as admin
UPDATE `user` SET `role` = 'admin' WHERE `role` = 'admin';
