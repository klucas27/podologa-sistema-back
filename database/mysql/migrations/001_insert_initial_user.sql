USE podiatry_db;

-- Migration: Insert initial system user
-- NOTE: This uses SHA2 for the password for convenience. Replace with a bcrypt hash
-- and update your authentication logic to verify bcrypt in production.

INSERT INTO `user` (id, username, password_hash, professional_name, created_at, updated_at)
VALUES (
  UUID(),
  'anapaula',
  SHA2('12345678', 256),
  'Dr. Ana Paula',
  NOW(),
  NOW()
);

-- Rollback (delete the seeded user):
-- DELETE FROM `user` WHERE username = 'anapaula';
