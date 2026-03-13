-- Migration: Add professional table and link to appointments
-- Run after professional_09.sql has been sourced

USE podiatry_db;

-- Add professional_id column to appointments
ALTER TABLE appointments
    ADD COLUMN professional_id VARCHAR(36) NULL AFTER user_id,
    ADD CONSTRAINT fk_appointments_professional FOREIGN KEY (professional_id) REFERENCES professional(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD INDEX idx_appointments_professional (professional_id);
