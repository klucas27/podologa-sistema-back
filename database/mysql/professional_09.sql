USE podiatry_db;

-- DROP TABLE IF EXISTS professional;

CREATE TABLE professional (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    specialty VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(254),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT uc_professional_email UNIQUE (email(191)),
    INDEX idx_professional_full_name (full_name(191)),
    INDEX idx_professional_is_active (is_active),
    INDEX idx_professional_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
