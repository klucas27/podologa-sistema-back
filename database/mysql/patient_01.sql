USE podiatry_db;

-- DROP TABLE IF EXISTS patient;

CREATE TABLE patient (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    marital_status ENUM('single','married','divorced','widowed','other') NOT NULL DEFAULT 'other',
    occupation VARCHAR(100),
    cpf CHAR(11) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(254),
    zip_code VARCHAR(20),
    street VARCHAR(255),
    address_number VARCHAR(20),
    neighborhood VARCHAR(100),
    city VARCHAR(100),
    state CHAR(2),
    CONSTRAINT uc_patient_cpf UNIQUE (cpf),
    CONSTRAINT uc_patient_email UNIQUE (email(191)),
    CONSTRAINT chk_cpf_format CHECK (cpf REGEXP '^[0-9]{11}$'),
    CONSTRAINT chk_state_format CHECK (state REGEXP '^[A-Z]{2}$'),
    INDEX idx_full_name (full_name(191)),
    INDEX idx_city_state (city, state),
    INDEX idx_phone (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
