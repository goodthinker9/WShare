-- ============================================================
-- WolloShare PostgreSQL seed data for Supabase
-- Converted from database/seed.sql.
-- Run after database/schema.postgres.sql.
-- Safe to run more than once without duplicating seed rows.
-- ============================================================

-- ============================================================
-- 1. Wollo University
-- ============================================================
INSERT INTO universities (name, short_name, email_domain, address)
SELECT 'Wollo University', 'WU', 'wollo.edu.et', 'Dessie, Amhara, Ethiopia'
WHERE NOT EXISTS (
    SELECT 1 FROM universities WHERE email_domain = 'wollo.edu.et'
);

-- ============================================================
-- 2. Faculties / Colleges
-- ============================================================
INSERT INTO faculties (university_id, name, short_name)
SELECT u.id, source.name, source.short_name
FROM universities u
CROSS JOIN (VALUES
    ('College of Engineering and Technology', 'CET'),
    ('College of Natural and Computational Sciences', 'CNCS'),
    ('College of Business and Economics', 'CBE'),
    ('Institute of Technology', 'IOT')
) AS source(name, short_name)
WHERE u.email_domain = 'wollo.edu.et'
  AND NOT EXISTS (
      SELECT 1
      FROM faculties f
      WHERE f.university_id = u.id
        AND f.name = source.name
  );

-- ============================================================
-- 3. Departments
-- ============================================================
INSERT INTO departments (faculty_id, name, code)
SELECT f.id, source.name, source.code
FROM (VALUES
    ('College of Engineering and Technology', 'Software Engineering', 'SWE'),
    ('College of Engineering and Technology', 'Information Technology', 'IT'),
    ('College of Engineering and Technology', 'Computer Science', 'CS'),
    ('College of Engineering and Technology', 'Information Systems', 'IS'),
    ('College of Engineering and Technology', 'Mechanical Engineering', 'ME'),
    ('College of Engineering and Technology', 'Electrical Engineering', 'EE'),
    ('College of Engineering and Technology', 'Construction Technology and Management', 'COTM'),
    ('College of Engineering and Technology', 'Biomedical Engineering', 'BME'),
    ('College of Engineering and Technology', 'Civil Engineering', 'CE'),
    ('College of Engineering and Technology', 'Architecture', 'ARCH'),
    ('College of Engineering and Technology', 'Mechatronics Engineering', 'MTE'),
    ('College of Engineering and Technology', 'Water Resources Engineering', 'WRE'),
    ('College of Natural and Computational Sciences', 'Fashion Design', 'FD'),
    ('College of Natural and Computational Sciences', 'Garment Engineering', 'GE'),
    ('College of Natural and Computational Sciences', 'Natural Science Freshman', 'NSF'),
    ('College of Engineering and Technology', 'Pre-Engineering Freshman', 'PEF')
) AS source(faculty_name, name, code)
JOIN faculties f ON f.name = source.faculty_name
JOIN universities u ON u.id = f.university_id
WHERE u.email_domain = 'wollo.edu.et'
  AND NOT EXISTS (
      SELECT 1
      FROM departments d
      WHERE d.faculty_id = f.id
        AND d.name = source.name
  );

-- ============================================================
-- 4. Academic Levels
-- ============================================================
INSERT INTO academic_levels (name, display_order, is_freshman)
SELECT source.name, source.display_order, source.is_freshman
FROM (VALUES
    ('Freshman Semester 1', 1, TRUE),
    ('Freshman Semester 2', 2, TRUE),
    ('Year 2', 3, FALSE),
    ('Year 3', 4, FALSE),
    ('Year 4', 5, FALSE),
    ('Year 5', 6, FALSE)
) AS source(name, display_order, is_freshman)
WHERE NOT EXISTS (
    SELECT 1 FROM academic_levels al WHERE al.name = source.name
);

-- ============================================================
-- 5. Semesters
-- ============================================================
INSERT INTO semesters (name, short_name, display_order)
SELECT source.name, source.short_name, source.display_order
FROM (VALUES
    ('Semester 1', 'S1', 1),
    ('Semester 2', 'S2', 2)
) AS source(name, short_name, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM semesters s WHERE s.short_name = source.short_name
);

-- ============================================================
-- 6. Resource Types
-- ============================================================
INSERT INTO resource_types (name, extension, max_file_size)
VALUES
    ('PDF', '.pdf', 52428800),
    ('DOCX', '.docx', 52428800),
    ('DOC', '.doc', 52428800),
    ('PPT', '.ppt', 104857600),
    ('PPTX', '.pptx', 104857600),
    ('ZIP', '.zip', 209715200),
    ('RAR', '.rar', 209715200),
    ('Image', '.jpg,.jpeg,.png,.gif,.webp', 20971520),
    ('Video', '.mp4,.avi,.mkv,.mov', 524288000)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 7. System Settings
-- ============================================================
INSERT INTO system_settings (setting_key, setting_value, setting_group, description, is_public)
VALUES
    ('site_name', 'WolloShare', 'general', 'Site name', TRUE),
    ('site_description', 'Wollo University Academic Resource Sharing Platform', 'general', 'Site description', TRUE),
    ('max_file_size', '52428800', 'upload', 'Maximum file upload size in bytes', FALSE),
    ('allowed_file_types', 'pdf,docx,doc,ppt,pptx,zip,rar,jpg,jpeg,png,gif,webp,mp4,avi,mkv,mov', 'upload', 'Comma separated allowed file extensions', FALSE),
    ('student_auto_approve', '0', 'verification', 'Automatically approve student registrations', FALSE),
    ('maintenance_mode', '0', 'general', 'Enable maintenance mode', FALSE),
    ('items_per_page', '20', 'pagination', 'Default items per page', FALSE),
    ('enable_notifications', '1', 'notifications', 'Enable system notifications', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- 8. Default Admin Account (password: Admin@123)
-- ============================================================
-- bcrypt hash for 'Admin@123'
INSERT INTO users (full_name, email, password_hash, role, account_status, verification_status)
VALUES (
    'System Admin',
    'admin@wollo.edu.et',
    '$2b$12$VSxu8kdFiXEaIXmMrrqQKu5w5oNvNbkPd.z5oDDlK2WnuRjk5Hp72',
    'admin',
    'active',
    'approved'
)
ON CONFLICT (email) DO NOTHING;
