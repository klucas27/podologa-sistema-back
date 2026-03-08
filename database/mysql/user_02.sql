USE podiatry_db;

-- DROP TABLE IF EXISTS user;

CREATE TABLE user (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    professional_name VARCHAR(200),
    workday_start VARCHAR(5) NOT NULL DEFAULT '08:00',
    workday_end   VARCHAR(5) NOT NULL DEFAULT '18:00',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT uc_user_username UNIQUE (username(191)),
    INDEX idx_user_username (username(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
