-- Tabelas do módulo WhatsApp
-- Executar no banco podiatry_db

CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `id`          VARCHAR(36)                              NOT NULL,
  `patient_id`  VARCHAR(36)                              NULL,
  `phone`       VARCHAR(20)                              NOT NULL,
  `direction`   ENUM('inbound', 'outbound')              NOT NULL,
  `content`     TEXT                                     NOT NULL,
  `status`      ENUM('sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'sent',
  `external_id` VARCHAR(100)                             NULL,
  `created_at`  TIMESTAMP                                NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_whatsapp_external_id` (`external_id`),
  INDEX   `idx_whatsapp_phone`   (`phone`),
  INDEX   `idx_whatsapp_patient` (`patient_id`),

  CONSTRAINT `fk_whatsapp_messages_patient`
    FOREIGN KEY (`patient_id`)
    REFERENCES `patient` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `whatsapp_conversation_states` (
  `phone`      VARCHAR(20) NOT NULL,
  `state`      VARCHAR(50) NOT NULL,
  `updated_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
