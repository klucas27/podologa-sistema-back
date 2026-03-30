-- =====================================================================
-- PodoSistem — Production Schema
-- Generated from: prisma/schema.prisma
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- MySQL 5.7+
-- =====================================================================

USE podiatry_db;

SET NAMES utf8mb4;
SET character_set_client      = utf8mb4;
SET character_set_connection  = utf8mb4;
SET character_set_results     = utf8mb4;
SET time_zone                 = '+00:00';
SET @OLD_FOREIGN_KEY_CHECKS   = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS        = 0;

-- ═════════════════════════════════════════════════════════════════════
-- 1. CORE ENTITIES (no FK dependencies)
-- ═════════════════════════════════════════════════════════════════════

-- ── 1.1 Patient ──────────────────────────────────────────────────────

CREATE TABLE `patient` (
    `id`             VARCHAR(36)  NOT NULL,
    `admin_id`       VARCHAR(36)  NOT NULL,
    `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `full_name`      VARCHAR(191) NOT NULL,
    `date_of_birth`  DATE         NULL     DEFAULT NULL,
    `marital_status` ENUM('single','married','divorced','widowed','other') NOT NULL DEFAULT 'other',
    `occupation`     VARCHAR(100) NULL     DEFAULT NULL,
    `cpf`            CHAR(11)     NOT NULL,
    `phone_number`   VARCHAR(20)  NULL     DEFAULT NULL,
    `email`          VARCHAR(191) NULL     DEFAULT NULL,
    `zip_code`       VARCHAR(20)  NULL     DEFAULT NULL,
    `street`         VARCHAR(255) NULL     DEFAULT NULL,
    `address_number` VARCHAR(20)  NULL     DEFAULT NULL,
    `neighborhood`   VARCHAR(100) NULL     DEFAULT NULL,
    `city`           VARCHAR(100) NULL     DEFAULT NULL,
    `state`          CHAR(2)      NULL     DEFAULT NULL,

    PRIMARY KEY (`id`),

    CONSTRAINT `uc_patient_cpf`   UNIQUE (`cpf`),
    CONSTRAINT `uc_patient_email` UNIQUE (`email`),

    CONSTRAINT `chk_cpf_format`   CHECK (`cpf` REGEXP '^[0-9]{11}$'),
    CONSTRAINT `chk_state_format` CHECK (`state` IS NULL OR `state` REGEXP '^[A-Z]{2}$'),

    INDEX `idx_patient_admin`  (`admin_id`),
    INDEX `idx_full_name`      (`full_name`(191)),
    INDEX `idx_city_state`     (`city`, `state`),
    INDEX `idx_phone`          (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 1.2 Professional ─────────────────────────────────────────────────

CREATE TABLE `professional` (
    `id`           VARCHAR(36)  NOT NULL,
    `admin_id`     VARCHAR(36)  NOT NULL,
    `full_name`    VARCHAR(200) NOT NULL,
    `specialty`    VARCHAR(100) NULL     DEFAULT NULL,
    `phone_number` VARCHAR(20)  NULL     DEFAULT NULL,
    `email`        VARCHAR(191) NULL     DEFAULT NULL,
    `is_active`    TINYINT(1)   NOT NULL DEFAULT 1,
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`   TIMESTAMP    NULL     DEFAULT NULL,

    PRIMARY KEY (`id`),

    CONSTRAINT `uc_professional_email` UNIQUE (`email`),

    INDEX `idx_professional_admin`      (`admin_id`),
    INDEX `idx_professional_full_name`  (`full_name`(191)),
    INDEX `idx_professional_is_active`  (`is_active`),
    INDEX `idx_professional_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 1.3 User ─────────────────────────────────────────────────────────

CREATE TABLE `user` (
    `id`                VARCHAR(36)  NOT NULL,
    `username`          VARCHAR(191) NOT NULL,
    `password_hash`     VARCHAR(255) NOT NULL,
    `professional_name` VARCHAR(200) NULL     DEFAULT NULL,
    `role`              ENUM('admin','professional') NOT NULL DEFAULT 'admin',
    `professional_id`   VARCHAR(36)  NULL     DEFAULT NULL,
    `workday_start`     VARCHAR(5)   NOT NULL DEFAULT '08:00',
    `workday_end`       VARCHAR(5)   NOT NULL DEFAULT '18:00',
    `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`        TIMESTAMP    NULL     DEFAULT NULL,

    PRIMARY KEY (`id`),

    CONSTRAINT `uc_user_username`        UNIQUE (`username`),
    CONSTRAINT `user_professional_id_key` UNIQUE (`professional_id`),

    CONSTRAINT `user_professional_id_fkey`
        FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX `idx_user_username` (`username`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 1.4 Refresh Token ────────────────────────────────────────────────

CREATE TABLE `refresh_token` (
    `id`         VARCHAR(36) NOT NULL,
    `user_id`    VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` TIMESTAMP   NOT NULL,
    `created_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `revoked_at` TIMESTAMP   NULL     DEFAULT NULL,

    PRIMARY KEY (`id`),

    CONSTRAINT `uc_refresh_token_hash` UNIQUE (`token_hash`),

    CONSTRAINT `fk_refresh_token_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX `idx_refresh_token_user`    (`user_id`),
    INDEX `idx_refresh_token_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 1.5 Pathology ────────────────────────────────────────────────────

CREATE TABLE `pathologies` (
    `id`          VARCHAR(36)  NOT NULL,
    `name`        VARCHAR(100) NOT NULL,
    `description` TEXT         NULL,
    `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    CONSTRAINT `uc_pathologies_name` UNIQUE (`name`),

    INDEX `idx_pathologies_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════════════
-- 2. PIVOT TABLE (N:N — Patient ↔ Professional)
-- ═════════════════════════════════════════════════════════════════════

CREATE TABLE `patient_professional` (
    `patient_id`      VARCHAR(36) NOT NULL,
    `professional_id` VARCHAR(36) NOT NULL,
    `created_at`      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`patient_id`, `professional_id`),

    CONSTRAINT `fk_pp_patient`
        FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT `fk_pp_professional`
        FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX `idx_patient_professional_prof` (`professional_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════════════
-- 3. TRANSACTIONAL ENTITIES (dependem de Patient, User, Professional)
-- ═════════════════════════════════════════════════════════════════════

-- ── 3.1 Appointment ──────────────────────────────────────────────────

CREATE TABLE `appointments` (
    `id`                VARCHAR(36) NOT NULL,
    `patient_id`        VARCHAR(36) NOT NULL,
    `user_id`           VARCHAR(36) NOT NULL,
    `professional_id`   VARCHAR(36) NULL     DEFAULT NULL,
    `scheduled_start`   DATETIME    NOT NULL,
    `scheduled_end`     DATETIME    NOT NULL,
    `scheduled_date`    DATE        NOT NULL,
    `actual_start_time` DATETIME    NULL     DEFAULT NULL,
    `actual_end_time`   DATETIME    NULL     DEFAULT NULL,
    `status`            ENUM('scheduled','confirmed','in_progress','cancelled','completed')
                            NOT NULL DEFAULT 'scheduled',
    `notes`             TEXT        NULL,
    `created_at`        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`        TIMESTAMP   NULL     DEFAULT NULL,

    PRIMARY KEY (`id`),

    CONSTRAINT `fk_appointments_patient`
        FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT `fk_appointments_user`
        FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT `fk_appointments_professional`
        FOREIGN KEY (`professional_id`) REFERENCES `professional` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX `idx_appointments_patient`      (`patient_id`),
    INDEX `idx_appointments_user`         (`user_id`),
    INDEX `idx_appointments_professional` (`professional_id`),
    INDEX `idx_appointments_date`         (`scheduled_date`),
    INDEX `idx_appointments_status`       (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3.2 Anamnesis ────────────────────────────────────────────────────

CREATE TABLE `anamnesis` (
    `id`                           VARCHAR(36)  NOT NULL,
    `patient_id`                   VARCHAR(36)  NOT NULL,
    `created_at`                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`                   TIMESTAMP    NULL     DEFAULT NULL,

    `frequently_used_footwear`     VARCHAR(100) NULL DEFAULT NULL,
    `frequently_used_socks`        VARCHAR(100) NULL DEFAULT NULL,
    `practiced_sports`             VARCHAR(255) NULL DEFAULT NULL,

    `has_lower_limb_surgery`       TINYINT(1)   NOT NULL DEFAULT 0,
    `lower_limb_surgery_details`   TEXT         NULL,
    `medications_in_use`           TEXT         NULL,
    `is_pregnant`                  TINYINT(1)   NOT NULL DEFAULT 0,
    `has_pacemaker_or_pins`        TINYINT(1)   NOT NULL DEFAULT 0,
    `has_hypertension`             TINYINT(1)   NOT NULL DEFAULT 0,
    `has_seizures`                 TINYINT(1)   NOT NULL DEFAULT 0,
    `has_cancer_history`           TINYINT(1)   NOT NULL DEFAULT 0,
    `has_diabetes`                 TINYINT(1)   NOT NULL DEFAULT 0,
    `has_circulatory_problems`     TINYINT(1)   NOT NULL DEFAULT 0,
    `has_healing_problems`         TINYINT(1)   NOT NULL DEFAULT 0,

    `perfusion`                    ENUM('normal','pale','cyanotic','edematous') NOT NULL DEFAULT 'normal',
    `has_monofilament_sensitivity` TINYINT(1)   NOT NULL DEFAULT 1,
    `dermatological_pathologies`   TEXT         NULL,
    `nail_pathologies`             TEXT         NULL,
    `other_observations`           TEXT         NULL,
    `pain_sensitivity`             ENUM('high','moderate','low','none') NULL DEFAULT 'none',

    PRIMARY KEY (`id`),

    CONSTRAINT `fk_anamnesis_patient`
        FOREIGN KEY (`patient_id`) REFERENCES `patient` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX `idx_anamnesis_patient`    (`patient_id`),
    INDEX `idx_anamnesis_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3.3 Clinical Evolution ───────────────────────────────────────────

CREATE TABLE `clinical_evolutions` (
    `id`                        VARCHAR(36)   NOT NULL,
    `appointment_id`            VARCHAR(36)   NOT NULL,
    `clinical_notes`            TEXT          NULL,
    `prescribed_medications`    TEXT          NULL,
    `home_care_recommendations` TEXT          NULL,
    `recommended_return_days`   INT UNSIGNED  NULL DEFAULT NULL,
    `created_at`                TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`                TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`                TIMESTAMP     NULL     DEFAULT NULL,

    PRIMARY KEY (`id`),

    CONSTRAINT `fk_clinical_evolutions_appointment`
        FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX `idx_clinical_evolutions_appointment` (`appointment_id`),
    INDEX `idx_clinical_evolutions_deleted_at`  (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3.4 Billing ──────────────────────────────────────────────────────

CREATE TABLE `billings` (
    `id`             VARCHAR(36)    NOT NULL,
    `appointment_id` VARCHAR(36)    NOT NULL,
    `amount`         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    `payment_method` ENUM('pix','credit_card','debit_card','cash','transfer','other') NOT NULL,
    `status`         ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
    `paid_at`        TIMESTAMP      NULL     DEFAULT NULL,
    `created_at`     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`     TIMESTAMP      NULL     DEFAULT NULL,

    PRIMARY KEY (`id`),

    CONSTRAINT `fk_billings_appointment`
        FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT `chk_billings_amount_nonnegative` CHECK (`amount` >= 0),

    INDEX `idx_billings_appointment`   (`appointment_id`),
    INDEX `idx_billings_status`        (`status`),
    INDEX `idx_billings_payment_method`(`payment_method`),
    INDEX `idx_billings_deleted_at`    (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════════════
-- 4. PIVOT TABLE (N:N — ClinicalEvolution ↔ Pathology)
-- ═════════════════════════════════════════════════════════════════════

CREATE TABLE `evolution_pathologies` (
    `evolution_id` VARCHAR(36)  NOT NULL,
    `pathology_id` VARCHAR(36)  NOT NULL,
    `body_part`    ENUM('right_foot','left_foot','right_hand','left_hand') NOT NULL,
    `notes`        VARCHAR(255) NULL DEFAULT NULL,
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`evolution_id`, `pathology_id`, `body_part`),

    CONSTRAINT `fk_evolution_pathologies_evolution`
        FOREIGN KEY (`evolution_id`) REFERENCES `clinical_evolutions` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT `fk_evolution_pathologies_pathology`
        FOREIGN KEY (`pathology_id`) REFERENCES `pathologies` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX `idx_evolution_pathologies_pathology` (`pathology_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═════════════════════════════════════════════════════════════════════
-- 5. RESTORE FK CHECKS
-- ═════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
