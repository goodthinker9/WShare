-- ============================================================
-- WolloShare - Database Fix Script
-- Fixes partial seed + adds missing data
-- ============================================================
USE wolloshare;

-- 1. Fix resource_types.extension column size
ALTER TABLE resource_types MODIFY COLUMN extension VARCHAR(100);

-- 2. Insert missing resource_types
INSERT IGNORE INTO resource_types (name, extension, max_file_size) VALUES
('PDF', '.pdf', 52428800),
('DOCX', '.docx', 52428800),
('DOC', '.doc', 52428800),
('PPT', '.ppt', 104857600),
('PPTX', '.pptx', 104857600),
('ZIP', '.zip', 209715200),
('RAR', '.rar', 209715200),
('Image', '.jpg,.jpeg,.png,.gif,.webp', 20971520),
('Video', '.mp4,.avi,.mkv,.mov', 524288000);

-- 3. Insert missing system_settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_group, description, is_public) VALUES
('site_name', 'WolloShare', 'general', 'Site name', 1),
('site_description', 'Wollo University Academic Resource Sharing Platform', 'general', 'Site description', 1),
('max_file_size', '52428800', 'upload', 'Maximum file upload size in bytes', 0),
('allowed_file_types', 'pdf,docx,doc,ppt,pptx,zip,rar,jpg,jpeg,png,gif,webp,mp4,avi,mkv,mov', 'upload', 'Comma separated allowed file extensions', 0),
('student_auto_approve', '0', 'verification', 'Automatically approve student registrations', 0),
('maintenance_mode', '0', 'general', 'Enable maintenance mode', 0),
('items_per_page', '20', 'pagination', 'Default items per page', 0),
('enable_notifications', '1', 'notifications', 'Enable system notifications', 0);

-- 4. Insert default admin account (password: Admin@123)
INSERT IGNORE INTO users (full_name, email, password_hash, role, account_status, verification_status) VALUES
('System Admin', 'admin@wollo.edu.et', '$2b$12$SaYQ2NKUGrxlyFkQEickPuCBkb2pHdyeIPho.q7iQUe2OQD4c5b8m', 'admin', 'active', 'approved');

-- 5. Insert sample courses for demo (SWE Year 3/4, IT Year 4, etc.)
-- Level IDs: 1=FS1, 2=FS2, 3=Year2, 4=Year3, 5=Year4
-- Semester IDs: 1=S1, 2=S2
-- Department IDs: 1=SWE, 2=IT, 3=CS, 4=IS

INSERT IGNORE INTO courses (department_id, academic_level_id, semester_id, name, code, credit_hours) VALUES
-- Software Engineering (dept 1)
(1, 5, 1, 'Operating Systems', 'SWE401', 3.0),
(1, 5, 2, 'Software Project Management', 'SWE402', 3.0),
(1, 4, 1, 'Database Systems', 'SWE301', 3.0),
(1, 4, 2, 'Data Structures', 'SWE302', 3.0),
(1, 3, 1, 'Programming II', 'SWE201', 3.0),
-- Information Technology (dept 2)
(2, 5, 1, 'Advanced Networking', 'IT401', 3.0),
(2, 5, 2, 'Cloud Computing', 'IT402', 3.0),
(2, 4, 1, 'Web Development', 'IT301', 3.0),
(2, 3, 1, 'Introduction to Programming', 'IT201', 3.0),
-- Computer Science (dept 3)
(3, 5, 1, 'Machine Learning', 'CS401', 3.0),
(3, 4, 1, 'Algorithms', 'CS301', 3.0),
(3, 3, 1, 'Calculus II', 'CS201', 3.0),
-- Information Systems (dept 4)
(4, 5, 1, 'System Analysis and Design', 'IS401', 3.0),
(4, 4, 2, 'Database Administration', 'IS302', 3.0),
-- Freshman common courses (department NULL applies to all)
(NULL, 1, 1, 'Mathematics for Natural Science', 'Math101', 3.0),
(NULL, 1, 1, 'Physics for Natural Science', 'Phys101', 3.0),
(NULL, 1, 2, 'Chemistry for Natural Science', 'Chem102', 3.0),
(NULL, 2, 1, 'Pre-Engineering Mathematics', 'PMath101', 3.0),
(NULL, 2, 2, 'Engineering Drawing', 'EngDraw102', 2.0);

