USE podiatry_db;

-- DROP TABLE IF EXISTS appointments;

CREATE TABLE
    appointments (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        patient_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        professional_id VARCHAR(36) NULL,
        scheduled_start DATETIME NOT NULL,
        scheduled_end DATETIME NOT NULL,
        scheduled_date DATE NOT NULL,
        actual_start_time DATETIME NULL DEFAULT NULL,
        actual_end_time DATETIME NULL DEFAULT NULL,
        status ENUM (
            'scheduled',
            'confirmed',
            'in_progress',
            'cancelled',
            'completed'
        ) NOT NULL DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patient (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_appointments_professional FOREIGN KEY (professional_id) REFERENCES professional (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        INDEX idx_appointments_patient (patient_id),
        INDEX idx_appointments_user (user_id),
        INDEX idx_appointments_professional (professional_id),
        INDEX idx_appointments_date (scheduled_date),
        INDEX idx_appointments_status (status)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;