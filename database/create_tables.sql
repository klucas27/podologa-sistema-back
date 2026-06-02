-- ============================================================
-- ATENÇÃO — FONTE DUPLICADA (B1)
-- Este arquivo está fora de sincronização com migrate.ts.
-- A fonte de verdade do schema é: src/infra/database/migrate.ts
-- Este arquivo pode ser removido ou usado apenas como referência.
-- ============================================================

-- PodoSistem — MySQL Schema
-- Run once on a fresh database (alwaysdata or any MySQL 8+)
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS

SET NAMES utf8mb4;
SET time_zone = '-03:00';
SET foreign_key_checks = 0;

-- ── patient ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `patient` (
  `id`             VARCHAR(36)  NOT NULL,
  `admin_id`       VARCHAR(36)  NOT NULL,
  `full_name`      VARCHAR(191) NOT NULL,
  `date_of_birth`  DATE,
  `marital_status` ENUM('single','married','divorced','widowed','other') NOT NULL DEFAULT 'other',
  `occupation`     VARCHAR(100),
  `cpf`            CHAR(11)     NOT NULL,
  `phone_number`   VARCHAR(20),
  `email`          VARCHAR(191),
  `zip_code`       VARCHAR(20),
  `street`         VARCHAR(255),
  `address_number` VARCHAR(20),
  `neighborhood`   VARCHAR(100),
  `city`           VARCHAR(100),
  `state`          CHAR(2),
  `created_at`     TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_patient_cpf`   (`cpf`),
  UNIQUE KEY `uc_patient_email` (`email`),
  KEY `idx_patient_admin`  (`admin_id`),
  KEY `idx_full_name`      (`full_name`),
  KEY `idx_city_state`     (`city`, `state`),
  KEY `idx_phone`          (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── professional ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `professional` (
  `id`           VARCHAR(36)  NOT NULL,
  `admin_id`     VARCHAR(36)  NOT NULL,
  `full_name`    VARCHAR(200) NOT NULL,
  `specialty`    VARCHAR(100),
  `phone_number` VARCHAR(20),
  `email`        VARCHAR(191),
  `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`   TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_professional_email`  (`email`),
  KEY `idx_professional_admin`        (`admin_id`),
  KEY `idx_professional_full_name`    (`full_name`),
  KEY `idx_professional_is_active`    (`is_active`),
  KEY `idx_professional_deleted_at`   (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── user ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `user` (
  `id`                VARCHAR(36)               NOT NULL,
  `username`          VARCHAR(191)              NOT NULL,
  `password_hash`     VARCHAR(255)              NOT NULL,
  `professional_name` VARCHAR(200),
  `role`              ENUM('admin','professional') NOT NULL DEFAULT 'admin',
  `professional_id`   VARCHAR(36)               UNIQUE,
  `workday_start`     VARCHAR(5)                NOT NULL DEFAULT '08:00',
  `workday_end`       VARCHAR(5)                NOT NULL DEFAULT '18:00',
  `created_at`        TIMESTAMP(0)              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP(0)              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`        TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_user_username` (`username`),
  KEY `idx_user_username` (`username`),
  CONSTRAINT `fk_user_professional`
    FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── refresh_token ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `refresh_token` (
  `id`         VARCHAR(36)  NOT NULL,
  `user_id`    VARCHAR(36)  NOT NULL,
  `token_hash` VARCHAR(64)  NOT NULL,
  `expires_at` TIMESTAMP(0) NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_refresh_token_hash` (`token_hash`),
  KEY `idx_refresh_token_user`    (`user_id`),
  KEY `idx_refresh_token_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_token_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── patient_professional ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `patient_professional` (
  `patient_id`      VARCHAR(36)  NOT NULL,
  `professional_id` VARCHAR(36)  NOT NULL,
  `created_at`      TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_id`, `professional_id`),
  KEY `idx_patient_professional_prof` (`professional_id`),
  CONSTRAINT `fk_pp_patient`
    FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pp_professional`
    FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── appointments ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `appointments` (
  `id`               VARCHAR(36)  NOT NULL,
  `patient_id`       VARCHAR(36)  NOT NULL,
  `user_id`          VARCHAR(36)  NOT NULL,
  `professional_id`  VARCHAR(36),
  `scheduled_start`  DATETIME(0)  NOT NULL,
  `scheduled_end`    DATETIME(0)  NOT NULL,
  `scheduled_date`   DATE         NOT NULL,
  `actual_start_time` DATETIME(0),
  `actual_end_time`  DATETIME(0),
  `status`           ENUM('scheduled','confirmed','in_progress','cancelled','completed') NOT NULL DEFAULT 'scheduled',
  `notes`            TEXT,
  `created_at`       TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`       TIMESTAMP(0),
  PRIMARY KEY (`id`),
  KEY `idx_appointments_patient`      (`patient_id`),
  KEY `idx_appointments_user`         (`user_id`),
  KEY `idx_appointments_professional` (`professional_id`),
  KEY `idx_appointments_date`         (`scheduled_date`),
  KEY `idx_appointments_status`       (`status`),
  CONSTRAINT `fk_appointments_patient`
    FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointments_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointments_professional`
    FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── clinical_evolutions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `clinical_evolutions` (
  `id`                       VARCHAR(36)  NOT NULL,
  `appointment_id`           VARCHAR(36)  NOT NULL,
  `clinical_notes`           TEXT,
  `prescribed_medications`   TEXT,
  `home_care_recommendations` TEXT,
  `recommended_return_days`  INT UNSIGNED,
  `created_at`               TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`               TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`               TIMESTAMP(0),
  PRIMARY KEY (`id`),
  KEY `idx_clinical_evolutions_appointment` (`appointment_id`),
  KEY `idx_clinical_evolutions_deleted_at`  (`deleted_at`),
  CONSTRAINT `fk_clinical_evolutions_appointment`
    FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── pathologies ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `pathologies` (
  `id`          VARCHAR(36)  NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at`  TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_pathologies_name` (`name`),
  KEY `idx_pathologies_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── evolution_pathologies ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `evolution_pathologies` (
  `evolution_id` VARCHAR(36)                                           NOT NULL,
  `pathology_id` VARCHAR(36)                                           NOT NULL,
  `body_part`    ENUM('right_foot','left_foot','right_hand','left_hand') NOT NULL,
  `notes`        VARCHAR(255),
  `created_at`   TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`evolution_id`, `pathology_id`, `body_part`),
  KEY `idx_evolution_pathologies_pathology` (`pathology_id`),
  CONSTRAINT `fk_ep_evolution`
    FOREIGN KEY (`evolution_id`) REFERENCES `clinical_evolutions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ep_pathology`
    FOREIGN KEY (`pathology_id`) REFERENCES `pathologies` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── billings ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `billings` (
  `id`             VARCHAR(36)  NOT NULL,
  `appointment_id` VARCHAR(36)  NOT NULL,
  `amount`         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('pix','credit_card','debit_card','cash','transfer','other') NOT NULL,
  `status`         ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
  `paid_at`        TIMESTAMP(0),
  `created_at`     TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`     TIMESTAMP(0),
  PRIMARY KEY (`id`),
  KEY `idx_billings_appointment`    (`appointment_id`),
  KEY `idx_billings_status`         (`status`),
  KEY `idx_billings_payment_method` (`payment_method`),
  KEY `idx_billings_deleted_at`     (`deleted_at`),
  CONSTRAINT `fk_billings_appointment`
    FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── anamnesis ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `anamnesis` (
  `id`                          VARCHAR(36)  NOT NULL,
  `patient_id`                  VARCHAR(36)  NOT NULL,
  `frequently_used_footwear`    VARCHAR(100),
  `frequently_used_socks`       VARCHAR(100),
  `practiced_sports`            VARCHAR(255),
  `has_lower_limb_surgery`      TINYINT(1)   NOT NULL DEFAULT 0,
  `lower_limb_surgery_details`  TEXT,
  `medications_in_use`          TEXT,
  `is_pregnant`                 TINYINT(1)   NOT NULL DEFAULT 0,
  `has_pacemaker_or_pins`       TINYINT(1)   NOT NULL DEFAULT 0,
  `has_hypertension`            TINYINT(1)   NOT NULL DEFAULT 0,
  `has_seizures`                TINYINT(1)   NOT NULL DEFAULT 0,
  `has_cancer_history`          TINYINT(1)   NOT NULL DEFAULT 0,
  `has_diabetes`                TINYINT(1)   NOT NULL DEFAULT 0,
  `has_circulatory_problems`    TINYINT(1)   NOT NULL DEFAULT 0,
  `has_healing_problems`        TINYINT(1)   NOT NULL DEFAULT 0,
  `perfusion`                   ENUM('normal','pale','cyanotic','edematous') NOT NULL DEFAULT 'normal',
  `has_monofilament_sensitivity` TINYINT(1)  NOT NULL DEFAULT 1,
  `dermatological_pathologies`  TEXT,
  `nail_pathologies`            TEXT,
  `other_observations`          TEXT,
  `pain_sensitivity`            ENUM('high','moderate','low','none') DEFAULT 'none',
  `created_at`                  TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`                  TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`                  TIMESTAMP(0),
  PRIMARY KEY (`id`),
  KEY `idx_anamnesis_patient`    (`patient_id`),
  KEY `idx_anamnesis_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_anamnesis_patient`
    FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
