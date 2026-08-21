-- ============================================================
-- WolloShare - Seed Data
-- ============================================================

USE wolloshare;

-- ============================================================
-- 1. Wollo University
-- ============================================================
INSERT INTO universities (name, short_name, email_domain, address)
VALUES ('Wollo University', 'WU', 'wollo.edu.et', 'Dessie, Amhara, Ethiopia');

-- Get the university ID
SET @wu_id = LAST_INSERT_ID();

-- ============================================================
-- 2. Faculties / Colleges
-- ============================================================
INSERT INTO faculties (university_id, name, short_name) VALUES
(@wu_id, 'College of Engineering and Technology', 'CET'),
(@wu_id, 'College of Natural and Computational Sciences', 'CNCS'),
(@wu_id, 'College of Business and Economics', 'CBE'),
(@wu_id, 'Institute of Technology', 'IOT');

SET @cet_id = 1;
SET @cncs_id = 2;
SET @cbe_id = 3;
SET @iot_id = 4;

-- ============================================================
-- 3. Departments
-- ============================================================
INSERT INTO departments (faculty_id, name, code) VALUES
-- CET Departments
(@cet_id, 'Software Engineering', 'SWE'),
(@cet_id, 'Information Technology', 'IT'),
(@cet_id, 'Computer Science', 'CS'),
(@cet_id, 'Information Systems', 'IS'),
(@cet_id, 'Mechanical Engineering', 'ME'),
(@cet_id, 'Electrical Engineering', 'EE'),
(@cet_id, 'Construction Technology and Management', 'COTM'),
(@cet_id, 'Biomedical Engineering', 'BME'),
(@cet_id, 'Civil Engineering', 'CE'),
(@cet_id, 'Architecture', 'ARCH'),
(@cet_id, 'Mechatronics Engineering', 'MTE'),
(@cet_id, 'Water Resources Engineering', 'WRE'),
-- CNCS Departments
(@cncs_id, 'Fashion Design', 'FD'),
(@cncs_id, 'Garment Engineering', 'GE'),
-- Natural Science (Freshman)
(@cncs_id, 'Natural Science Freshman', 'NSF'),
-- Pre-Engineering (Freshman)
(@cet_id, 'Pre-Engineering Freshman', 'PEF');

-- ============================================================
-- 4. Academic Levels
-- ============================================================
INSERT INTO academic_levels (name, display_order, is_freshman) VALUES
('Freshman Semester 1', 1, 1),
('Freshman Semester 2', 2, 1),
('Year 2', 3, 0),
('Year 3', 4, 0),
('Year 4', 5, 0),
('Year 5', 6, 0);

-- ============================================================
-- 5. Semesters
-- ============================================================
INSERT INTO semesters (name, short_name, display_order) VALUES
('Semester 1', 'S1', 1),
('Semester 2', 'S2', 2);

-- ============================================================
-- 6. Resource Types
-- ============================================================
INSERT INTO resource_types (name, extension, max_file_size) VALUES
('PDF', '.pdf', 52428800),
('DOCX', '.docx', 52428800),
('DOC', '.doc', 52428800),
('PPT', '.ppt', 104857600),
('PPTX', '.pptx', 104857600),
('ZIP', '.zip', 209715200),
('RAR', '.rar', 209715200),
('Image', '.jpg,.jpeg,.png,.gif,.webp', 20971520),
('Video', '.mp4,.avi,.mkv,.mov', 524288000);

-- ============================================================
-- 7. System Settings
-- ============================================================
INSERT INTO system_settings (setting_key, setting_value, setting_group, description, is_public) VALUES
('site_name', 'WolloShare', 'general', 'Site name', 1),
('site_description', 'Wollo University Academic Resource Sharing Platform', 'general', 'Site description', 1),
('max_file_size', '52428800', 'upload', 'Maximum file upload size in bytes', 0),
('allowed_file_types', 'pdf,docx,doc,ppt,pptx,zip,rar,jpg,jpeg,png,gif,webp,mp4,avi,mkv,mov', 'upload', 'Comma separated allowed file extensions', 0),
('student_auto_approve', '0', 'verification', 'Automatically approve student registrations', 0),
('maintenance_mode', '0', 'general', 'Enable maintenance mode', 0),
('items_per_page', '20', 'pagination', 'Default items per page', 0),
('enable_notifications', '1', 'notifications', 'Enable system notifications', 0);

-- ============================================================
-- 8. Default Admin Account (password: Admin@123)
-- ============================================================
-- bcrypt hash for 'Admin@123'
INSERT INTO users (full_name, email, password_hash, role, account_status, verification_status) VALUES
('System Admin', 'admin@wollo.edu.et', '$2b$12$VSxu8kdFiXEaIXmMrrqQKu5w5oNvNbkPd.z5oDDlK2WnuRjk5Hp72', 'admin', 'active', 'approved');

