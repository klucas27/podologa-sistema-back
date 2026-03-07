USE podiatry_db;

-- DROP TABLE IF EXISTS clinical_evolutions;

CREATE TABLE clinical_evolutions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,

    clinical_notes TEXT,

    prescribed_medications TEXT,
    home_care_recommendations TEXT,
    recommended_return_days INT UNSIGNED,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT fk_clinical_evolutions_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_clinical_evolutions_appointment (appointment_id),
    INDEX idx_clinical_evolutions_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
