import { pool } from "./db";
import type { Logger } from "pino";

// Tables must be created in FK-dependency order.
// professional → user → patient → appointments → clinical_evolutions
// → pathologies → evolution_pathologies → billings → anamnesis
// → refresh_token → patient_professional

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS \`professional\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    specialty VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(254),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT uc_professional_email UNIQUE (email(191)),
    INDEX idx_professional_admin (admin_id),
    INDEX idx_professional_full_name (full_name(191)),
    INDEX idx_professional_is_active (is_active),
    INDEX idx_professional_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`user\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    username VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    professional_name VARCHAR(200),
    role ENUM('admin','professional') NOT NULL DEFAULT 'admin',
    professional_id VARCHAR(36) NULL,
    workday_start VARCHAR(5) NOT NULL DEFAULT '08:00',
    workday_end VARCHAR(5) NOT NULL DEFAULT '18:00',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT uc_user_username UNIQUE (username(191)),
    UNIQUE INDEX user_professional_id_key (professional_id),
    INDEX idx_user_username (username(191)),
    CONSTRAINT user_professional_id_fkey
      FOREIGN KEY (professional_id) REFERENCES \`professional\` (id)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`patient\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
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
    INDEX idx_patient_admin (admin_id),
    INDEX idx_full_name (full_name(191)),
    INDEX idx_city_state (city, state),
    INDEX idx_phone (phone_number)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`appointments\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    professional_id VARCHAR(36) NULL,
    scheduled_start DATETIME NOT NULL,
    scheduled_end DATETIME NOT NULL,
    scheduled_date DATE NOT NULL,
    actual_start_time DATETIME NULL DEFAULT NULL,
    actual_end_time DATETIME NULL DEFAULT NULL,
    status ENUM('scheduled','confirmed','in_progress','cancelled','completed') NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_appointments_patient
      FOREIGN KEY (patient_id) REFERENCES \`patient\` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_user
      FOREIGN KEY (user_id) REFERENCES \`user\` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_appointments_professional
      FOREIGN KEY (professional_id) REFERENCES \`professional\` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_appointments_patient (patient_id),
    INDEX idx_appointments_user (user_id),
    INDEX idx_appointments_professional (professional_id),
    INDEX idx_appointments_date (scheduled_date),
    INDEX idx_appointments_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`clinical_evolutions\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    clinical_notes TEXT,
    prescribed_medications TEXT,
    home_care_recommendations TEXT,
    recommended_return_days INT UNSIGNED,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_clinical_evolutions_appointment
      FOREIGN KEY (appointment_id) REFERENCES \`appointments\` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_clinical_evolutions_appointment (appointment_id),
    INDEX idx_clinical_evolutions_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`pathologies\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uc_pathologies_name UNIQUE (name),
    INDEX idx_pathologies_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`evolution_pathologies\` (
    evolution_id VARCHAR(36) NOT NULL,
    pathology_id VARCHAR(36) NOT NULL,
    body_part ENUM('right_foot','left_foot','right_hand','left_hand') NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (evolution_id, pathology_id, body_part),
    CONSTRAINT fk_evolution_pathologies_evolution
      FOREIGN KEY (evolution_id) REFERENCES \`clinical_evolutions\` (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_evolution_pathologies_pathology
      FOREIGN KEY (pathology_id) REFERENCES \`pathologies\` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_evolution_pathologies_pathology (pathology_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`billings\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('pix','credit_card','debit_card','cash','transfer','other') NOT NULL,
    status ENUM('pending','paid','cancelled','refunded') NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_billings_appointment
      FOREIGN KEY (appointment_id) REFERENCES \`appointments\` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_billings_amount_nonnegative CHECK (amount >= 0),
    INDEX idx_billings_appointment (appointment_id),
    INDEX idx_billings_status (status),
    INDEX idx_billings_payment_method (payment_method),
    INDEX idx_billings_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`anamnesis\` (
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
    CONSTRAINT fk_anamnesis_patient
      FOREIGN KEY (patient_id) REFERENCES \`patient\` (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_anamnesis_patient (patient_id),
    INDEX idx_anamnesis_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`refresh_token\` (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY uc_refresh_token_token_hash (token_hash),
    KEY idx_refresh_token_user (user_id),
    KEY idx_refresh_token_expires (expires_at),
    CONSTRAINT fk_refresh_token_user
      FOREIGN KEY (user_id) REFERENCES \`user\` (id) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`patient_professional\` (
    patient_id VARCHAR(36) NOT NULL,
    professional_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (patient_id, professional_id),
    INDEX idx_patient_professional_prof (professional_id),
    CONSTRAINT patient_professional_patient_fkey
      FOREIGN KEY (patient_id) REFERENCES \`patient\` (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT patient_professional_professional_fkey
      FOREIGN KEY (professional_id) REFERENCES \`professional\` (id) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export async function runMigrations(log: Logger): Promise<void> {
  const conn = await pool.getConnection();
  try {
    for (const ddl of DDL_STATEMENTS) {
      await conn.execute(ddl);
    }
    log.info("Database tables verified/created successfully");
  } catch (err) {
    log.error({ err }, "Failed to initialize database tables");
    throw err;
  } finally {
    conn.release();
  }
}
