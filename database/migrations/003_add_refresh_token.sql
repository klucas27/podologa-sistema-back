-- Migration: 003_add_refresh_token.sql
-- Cria a tabela `refresh_token` usada pelo mecanismo de refresh tokens.
-- Execute este arquivo no banco MySQL do projeto (ou gere uma migration via Prisma).

CREATE TABLE IF NOT EXISTS `refresh_token` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uc_refresh_token_token_hash` (`token_hash`),
  KEY `idx_refresh_token_user` (`user_id`),
  KEY `idx_refresh_token_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
