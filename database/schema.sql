-- ============================================================
-- WolloShare Database Schema
-- University Academic Resource Sharing Platform
-- ============================================================

CREATE DATABASE IF NOT EXISTS wolloshare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wolloshare;

-- ============================================================
-- UNIVERSITIES
-- ============================================================
CREATE TABLE universities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    email_domain VARCHAR(100) NOT NULL,
    address TEXT,
    logo_url VARCHAR(500),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_universities_active (is_active),
    INDEX idx_universities_email_domain (email_domain)
) ENGINE=InnoDB;

-- ============================================================
-- FACULTIES / COLLEGES
-- ============================================================
CREATE TABLE faculties (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    university_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    INDEX idx_faculties_university (university_id),
    INDEX idx_faculties_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
    INDEX idx_departments_faculty (faculty_id),
    INDEX idx_departments_active (is_active),
    INDEX idx_departments_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- ACADEMIC LEVELS
-- ============================================================
CREATE TABLE academic_levels (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_freshman TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_levels_order (display_order),
    INDEX idx_levels_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- SEMESTERS
-- ============================================================
CREATE TABLE semesters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_semesters_active (is_active),
    INDEX idx_semesters_order (display_order)
) ENGINE=InnoDB;

-- ============================================================
-- RESOURCE TYPES
-- ============================================================
CREATE TABLE resource_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    extension VARCHAR(100),
    icon VARCHAR(100),
    max_file_size BIGINT UNSIGNED NOT NULL DEFAULT 52428800,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- USERS (Students & Admins)
-- ============================================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    profile_image VARCHAR(500),
    university_id_card VARCHAR(500),
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    
    -- Account Status
    account_status ENUM('pending', 'active', 'suspended', 'disabled') NOT NULL DEFAULT 'pending',
    verification_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    
    -- Verification metadata
    verified_by INT UNSIGNED,
    verified_at TIMESTAMP NULL,
    
    -- Assigned academic info
    university_id INT UNSIGNED,
    faculty_id INT UNSIGNED,
    department_id INT UNSIGNED,
    academic_level_id INT UNSIGNED,
    semester_id INT UNSIGNED,
    
    -- Auth
    refresh_token VARCHAR(500),
    last_login_at TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    
    -- Metadata
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (academic_level_id) REFERENCES academic_levels(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_users_email (email),
    INDEX idx_users_student_id (student_id),
    INDEX idx_users_role (role),
    INDEX idx_users_account_status (account_status),
    INDEX idx_users_verification_status (verification_status),
    INDEX idx_users_department (department_id),
    INDEX idx_users_academic_level (academic_level_id),
    INDEX idx_users_semester (semester_id),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- ============================================================
-- STUDENT VERIFICATION LOG
-- ============================================================
CREATE TABLE student_verifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    admin_id INT UNSIGNED NOT NULL,
    action ENUM('approved', 'rejected', 'suspended', 'reactivated') NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_verifications_user (user_id),
    INDEX idx_verifications_admin (admin_id),
    INDEX idx_verifications_action (action)
) ENGINE=InnoDB;

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    department_id INT UNSIGNED,
    academic_level_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    credit_hours DECIMAL(3,1),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (academic_level_id) REFERENCES academic_levels(id) ON DELETE CASCADE,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
    INDEX idx_courses_department (department_id),
    INDEX idx_courses_level (academic_level_id),
    INDEX idx_courses_semester (semester_id),
    INDEX idx_courses_active (is_active),
    INDEX idx_courses_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- RESOURCES
-- ============================================================
CREATE TABLE resources (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uploader_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_id INT UNSIGNED,
    resource_type_id INT UNSIGNED,
    department_id INT UNSIGNED,
    academic_level_id INT UNSIGNED,
    semester_id INT UNSIGNED,
    
    -- File info
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    mime_type VARCHAR(100),
    file_extension VARCHAR(20),
    
    -- Status
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by INT UNSIGNED,
    reviewed_at TIMESTAMP NULL,
    
    -- Stats
    download_count INT UNSIGNED NOT NULL DEFAULT 0,
    view_count INT UNSIGNED NOT NULL DEFAULT 0,
    
    -- Metadata
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (academic_level_id) REFERENCES academic_levels(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_resources_uploader (uploader_id),
    INDEX idx_resources_course (course_id),
    INDEX idx_resources_department (department_id),
    INDEX idx_resources_level (academic_level_id),
    INDEX idx_resources_semester (semester_id),
    INDEX idx_resources_status (status),
    INDEX idx_resources_active (is_active),
    INDEX idx_resources_title (title),
    INDEX idx_resources_created (created_at),
    FULLTEXT INDEX idx_resources_search (title, description)
) ENGINE=InnoDB;

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE bookmarks (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    resource_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_resource (user_id, resource_id),
    INDEX idx_bookmarks_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- DOWNLOADS
-- ============================================================
CREATE TABLE downloads (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    resource_id INT UNSIGNED NOT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    INDEX idx_downloads_user (user_id),
    INDEX idx_downloads_resource (resource_id),
    INDEX idx_downloads_date (downloaded_at)
) ENGINE=InnoDB;

-- ============================================================
-- RATINGS & REVIEWS
-- ============================================================
CREATE TABLE ratings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    resource_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    is_edited TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_resource_rating (user_id, resource_id),
    INDEX idx_ratings_resource (resource_id),
    INDEX idx_ratings_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT UNSIGNED NOT NULL,
    resource_id INT UNSIGNED NOT NULL,
    reason ENUM('spam', 'copyright', 'duplicate', 'low_quality', 'wrong_department', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    resolved_by INT UNSIGNED,
    resolved_at TIMESTAMP NULL,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reports_status (status),
    INDEX idx_reports_resource (resource_id),
    INDEX idx_reports_reporter (reporter_id)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type ENUM(
        'verification_approved',
        'verification_rejected',
        'resource_approved',
        'resource_rejected',
        'report_resolved',
        'admin_announcement',
        'new_resource',
        'system'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    reference_type VARCHAR(50),
    reference_id INT UNSIGNED,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (user_id, is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT UNSIGNED,
    description TEXT,
    metadata JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_admin (admin_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================
CREATE TABLE system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_group VARCHAR(50) DEFAULT 'general',
    description TEXT,
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    updated_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_settings_key (setting_key),
    INDEX idx_settings_group (setting_group)
) ENGINE=InnoDB;

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE password_resets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_resets_token (token),
    INDEX idx_resets_user (user_id),
    INDEX idx_resets_expires (expires_at)
) ENGINE=InnoDB;

