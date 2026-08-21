-- ============================================================
-- WolloShare Migration: Allow NULL email for students
-- Students register using Student ID (unique) instead of email.
-- Admins retain an email for login.
-- ============================================================

USE wolloshare;

-- Make email column nullable (students register without email)
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(255) NULL;

-- Keep a unique index on email for the rows that have one (admins)
DROP INDEX idx_users_email ON users;
ALTER TABLE users
  ADD UNIQUE KEY uk_users_email (email);

-- Email uniqueness constraint only applies to non-NULL values in MySQL,
-- so multiple students with NULL email are allowed.

