-- WolloShare Version 1 invitation-code registration
CREATE TABLE IF NOT EXISTS invitation_codes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    university_id INT UNSIGNED NOT NULL,
    faculty_id INT UNSIGNED NOT NULL,
    department_id INT UNSIGNED NOT NULL,
    academic_level_id INT UNSIGNED NOT NULL,
    semester_id INT UNSIGNED NOT NULL,
    created_by INT UNSIGNED NOT NULL,
    max_uses INT UNSIGNED NOT NULL DEFAULT 1,
    used_count INT UNSIGNED NOT NULL DEFAULT 0,
    expires_at DATETIME NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT,
    FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE RESTRICT,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (academic_level_id) REFERENCES academic_levels(id) ON DELETE RESTRICT,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_invitation_codes_active (is_active),
    INDEX idx_invitation_codes_expires (expires_at)
) ENGINE=InnoDB;