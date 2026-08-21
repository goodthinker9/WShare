const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');
const { validateStudentId } = require('../utils/helpers');
const { ACCOUNT_STATUS, VERIFICATION_STATUS, USER_ROLES, STUDENT_ID_REGEX } = require('../utils/constants');

class AuthService {
  /**
   * Register a new student
   */
async register({ fullName, password, studentId, departmentId, academicLevelId, semesterId, universityIdCard }) {
    // Validate department/academicLevel/semester if provided
    if (departmentId) {
      const [dept] = await pool.query('SELECT id FROM departments WHERE id = ? AND is_active = 1', [departmentId]);
      if (dept.length === 0) {
        throw new AppError('Invalid department selected.', 400, 'INVALID_DEPARTMENT');
      }
    }
    if (academicLevelId) {
      const [lvl] = await pool.query('SELECT id FROM academic_levels WHERE id = ? AND is_active = 1', [academicLevelId]);
      if (lvl.length === 0) {
        throw new AppError('Invalid academic level selected.', 400, 'INVALID_LEVEL');
      }
    }
    if (semesterId) {
      const [sem] = await pool.query('SELECT id FROM semesters WHERE id = ? AND is_active = 1', [semesterId]);
      if (sem.length === 0) {
        throw new AppError('Invalid semester selected.', 400, 'INVALID_SEMESTER');
      }
    }

    // Validate student ID
    const idValidation = validateStudentId(studentId);
    if (!idValidation.valid) {
      throw new AppError(idValidation.message, 400, 'INVALID_STUDENT_ID');
    }

    // Check if student ID already exists
    const [existingStudentId] = await pool.query(
      'SELECT id FROM users WHERE student_id = ?',
      [studentId]
    );
    if (existingStudentId.length > 0) {
      throw new AppError('Student ID already registered.', 409, 'STUDENT_ID_EXISTS');
    }

    // Get Wollo University ID
    const [university] = await pool.query(
      'SELECT id FROM universities WHERE email_domain = ?',
      ['wollo.edu.et']
    );
    if (university.length === 0) {
      throw new AppError('University configuration not found.', 500, 'CONFIG_ERROR');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

// Create user
    const [result] = await pool.query(
      `INSERT INTO users (full_name, password_hash, student_id, university_id_card, university_id,
                          department_id, academic_level_id, semester_id,
                          role, account_status, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName.trim(),
        passwordHash,
        studentId,
        universityIdCard,
        university[0].id,
        departmentId || null,
        academicLevelId || null,
        semesterId || null,
        USER_ROLES.STUDENT,
        ACCOUNT_STATUS.PENDING,
        VERIFICATION_STATUS.PENDING
      ]
    );

    return {
      id: result.insertId,
      message: 'Registration successful. Please wait for admin verification.'
    };
  }

  /**
   * Login user (student or admin)
   * Students log in with their unique Student ID; admins log in with their email.
   */
  async login({ identifier, password }) {
    const identifierStr = String(identifier || '').trim();
    if (!identifierStr) {
      throw new AppError('Student ID or email is required.', 400, 'IDENTIFIER_REQUIRED');
    }

    const [users] = await pool.query(
      `SELECT id, full_name, email, password_hash, role, account_status, verification_status,
              rejection_reason, department_id, academic_level_id, semester_id, university_id, student_id
       FROM users
       WHERE student_id = ? OR email = ?`,
      [identifierStr, identifierStr.toLowerCase()]
    );

    if (users.length === 0) {
      throw new AppError('Invalid Student ID or password.', 401, 'INVALID_CREDENTIALS');
    }

    const user = users[0];

    // Check if account is disabled/suspended
    if (user.account_status === ACCOUNT_STATUS.DISABLED) {
      throw new AppError('Account disabled. Contact administrator.', 403, 'ACCOUNT_DISABLED');
    }

    if (user.account_status === ACCOUNT_STATUS.SUSPENDED) {
      throw new AppError('Account suspended. Contact administrator.', 403, 'ACCOUNT_SUSPENDED');
    }

    // Check if student is verified (students only)
    if (user.role === USER_ROLES.STUDENT && user.account_status === ACCOUNT_STATUS.PENDING) {
      throw new AppError('Account pending verification. Please wait for admin approval.', 403, 'PENDING_VERIFICATION');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid Student ID or password.', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.student_id,
      departmentId: user.department_id,
      academicLevelId: user.academic_level_id,
      semesterId: user.semester_id,
      verificationStatus: user.verification_status,
      accountStatus: user.account_status
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    // Store refresh token
    await pool.query(
      'UPDATE users SET refresh_token = ?, last_login_at = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        studentId: user.student_id,
        verificationStatus: user.verification_status,
        accountStatus: user.account_status,
        departmentId: user.department_id,
        academicLevelId: user.academic_level_id,
        semesterId: user.semester_id
      }
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      const [users] = await pool.query(
        `SELECT id, email, role, student_id, department_id, academic_level_id,
                semester_id, account_status, verification_status
         FROM users WHERE id = ? AND refresh_token = ?`,
        [decoded.id, refreshToken]
      );

      if (users.length === 0) {
        throw new AppError('Invalid refresh token.', 401, 'INVALID_REFRESH_TOKEN');
      }

      const user = users[0];
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        studentId: user.student_id,
        departmentId: user.department_id,
        academicLevelId: user.academic_level_id,
        semesterId: user.semester_id,
        verificationStatus: user.verification_status,
        accountStatus: user.account_status
      };

      const newAccessToken = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.student_id, u.role, 
              u.account_status, u.verification_status, u.rejection_reason,
              u.profile_image, u.university_id_card,
              u.department_id, u.academic_level_id, u.semester_id,
              u.university_id,
              d.name AS department_name,
              al.name AS academic_level_name,
              s.name AS semester_name,
              un.name AS university_name,
              f.name AS faculty_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN academic_levels al ON u.academic_level_id = al.id
       LEFT JOIN semesters s ON u.semester_id = s.id
       LEFT JOIN universities un ON u.university_id = un.id
       LEFT JOIN faculties f ON u.faculty_id = f.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    return users[0];
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const [users] = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect.', 400, 'WRONG_PASSWORD');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );

    return { message: 'Password changed successfully.' };
  }

  /**
   * Logout (invalidate refresh token)
   */
  async logout(userId) {
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = ?',
      [userId]
    );
    return { message: 'Logged out successfully.' };
  }
}

module.exports = new AuthService();

