-- Active: 1772923832540@@podiatry-db.mysql.uhserver.com@3306@podiatry_db
-- Initial database bootstrap for Podology system
-- Usage (Linux/macOS/Windows with mysql client):
--   mysql -u root -p < config_initial.sql
-- This script creates the database and then sources the schema files
-- in dependency order. It is safe to run multiple times (CREATE DATABASE IF NOT EXISTS).

-- Recommended SQL mode for stricter behavior
SET @OLD_SQL_MODE=@@SQL_MODE;
SET SQL_MODE='STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS podiatry_db
	DEFAULT CHARACTER SET = utf8mb4
	DEFAULT COLLATE = utf8mb4_unicode_ci;

USE podiatry_db;

-- Ensure client uses utf8mb4
SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;

-- Temporarily disable foreign key checks while creating objects in order
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS=0;

-- Source schema files in dependency order (relative paths)
-- 1) core entities
SOURCE patient.sql;
SOURCE user.sql;
SOURCE pathologies.sql;

-- 2) anamnesis (depends on patient)
SOURCE anamnesis.sql;

-- 3) appointments (depends on patient, user)
SOURCE appointments.sql;

-- 4) clinical evolutions and related
SOURCE clinical_evolutions.sql;
SOURCE evolution_pathologies.sql;

-- 5) billing and financials
SOURCE billings.sql;

-- 6) optional migrations / seeds
-- NOTE: migrations are idempotent if written carefully
-- SOURCE migrations/001_insert_initial_user.sql;

-- Re-enable foreign key checks and restore SQL mode
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- End of bootstrap