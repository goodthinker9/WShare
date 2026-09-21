-- ============================================================
-- WolloShare - Database Initialization Script
-- ============================================================

SOURCE schema.sql;
SOURCE seed.sql;
SOURCE migration_add_invitation_codes.sql;
SOURCE migration_add_user_invitation_code.sql;

-- WARNING: Run this file from MySQL CLI:
-- mysql -u root -p < init.sql
-- Or access the SQL files separately from MySQL workbench

