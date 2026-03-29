-- Migration: 004_add_professional_user_id.sql
-- Adiciona a coluna `user_id` na tabela `professional` para vincular cada profissional a um usuário do sistema.

ALTER TABLE `professional`
  ADD COLUMN `user_id` VARCHAR(36) NULL AFTER `admin_id`;

ALTER TABLE `professional`
  ADD UNIQUE INDEX `uc_professional_user_id` (`user_id`);

ALTER TABLE `professional`
  ADD CONSTRAINT `fk_professional_user` FOREIGN KEY (`user_id`)
    REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
