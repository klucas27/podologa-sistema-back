USE podiatry_db;

-- DROP TABLE IF EXISTS anamnesis;

CREATE TABLE anamnesis (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    frequently_used_footwear VARCHAR(100),
    frequently_used_socks VARCHAR(100),
    practiced_sports VARCHAR(255),

    has_lower_limb_surgery TINYINT(1) NOT NULL DEFAULT 0,
    lower_limb_surgery_details TEXT,
    medications_in_use TEXT,
    is_pregnant TINYINT(1) NOT NULL DEFAULT 0,
    has_pacemaker_or_pins TINYINT(1) NOT NULL DEFAULT 0,
    has_hypertension TINYINT(1) NOT NULL DEFAULT 0,
    has_seizures TINYINT(1) NOT NULL DEFAULT 0,
    has_cancer_history TINYINT(1) NOT NULL DEFAULT 0,
    has_diabetes TINYINT(1) NOT NULL DEFAULT 0,
    has_circulatory_problems TINYINT(1) NOT NULL DEFAULT 0,
    has_healing_problems TINYINT(1) NOT NULL DEFAULT 0,
    
    perfusion ENUM('normal','pale','cyanotic','edematous') NOT NULL DEFAULT 'normal',
    has_monofilament_sensitivity TINYINT(1) NOT NULL DEFAULT 1,
    dermatological_pathologies TEXT,
    nail_pathologies TEXT,
    other_observations TEXT,

    pain_sensitivity ENUM('high','moderate','low','none') DEFAULT 'none',

    CONSTRAINT fk_anamnesis_patient FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_anamnesis_patient (patient_id),
    INDEX idx_anamnesis_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
