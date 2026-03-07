USE podiatry_db;

-- DROP TABLE IF EXISTS billings;

CREATE TABLE billings (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,

    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('pix','credit_card','debit_card','cash','transfer', 'other') NOT NULL,
    status ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT fk_billings_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_billings_amount_nonnegative CHECK (amount >= 0),

    INDEX idx_billings_appointment (appointment_id),
    INDEX idx_billings_status (status),
    INDEX idx_billings_payment_method (payment_method),
    INDEX idx_billings_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
