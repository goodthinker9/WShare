-- Store the invitation code used during student registration.
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'invitation_code'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE users ADD COLUMN invitation_code VARCHAR(80) NULL AFTER student_id',
  'SELECT 1'
);

PREPARE add_invitation_code FROM @sql;
EXECUTE add_invitation_code;
DEALLOCATE PREPARE add_invitation_code;

SET @index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'idx_users_invitation_code'
);

SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE users ADD INDEX idx_users_invitation_code (invitation_code)',
  'SELECT 1'
);

PREPARE add_invitation_code_index FROM @sql;
EXECUTE add_invitation_code_index;
DEALLOCATE PREPARE add_invitation_code_index;
