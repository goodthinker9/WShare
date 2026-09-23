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
async register({ fullName, email, password, studentId, invitationCode, departmentId, academicLevelId, semesterId, profileImage }) {
    const normalizedInvitationCode = String(invitationCode || '').trim().toUpperCase();
    if (!normalizedInvitationCode) {
      throw new AppError('Invitation code is required.', 400, 'INVITATION_REQUIRED');
    }
    const { rows: assignments } = await pool.query(
      `SELECT d.id AS department_id, d.faculty_id, f.university_id,
              al.id AS academic_level_id, s.id AS semester_id
       FROM departments d
      JOIN faculties f ON f.id = d.faculty_id AND f.is_active = TRUE
      JOIN academic_levels al ON al.id = $1 AND al.is_active = TRUE
      JOIN semesters s ON s.id = $2 AND s.is_active = TRUE
      WHERE d.id = $3 AND d.is_active = TRUE`,
      [academicLevelId, semesterId, departmentId]
    );
    const assignment = assignments[0];
    if (!assignment) {
      throw new AppError('Invalid academic assignment.', 400, 'INVALID_ASSIGNMENT');
    }

    let invitation = null;
    if (normalizedInvitationCode) {
      const { rows: codes } = await pool.query(
        `SELECT id, university_id, department_id, academic_level_id, semester_id,
                max_uses, used_count, expires_at, is_active
         FROM invitation_codes
         WHERE code = $1`,
        [normalizedInvitationCode]
      );
      invitation = codes[0];

      if (!invitation || !invitation.is_active) {
        throw new AppError('Invalid or disabled invitation code.', 400, 'INVALID_INVITATION');
      }
      if (invitation.expires_at && new Date(invitation.expires_at) <= new Date()) {
        throw new AppError('Invitation code has expired.', 400, 'INVITATION_EXPIRED');
      }
      if (invitation.used_count >= invitation.max_uses) {
        throw new AppError('Invitation code has reached its maximum uses.', 409, 'INVITATION_EXHAUSTED');
      }
      if (invitation.department_id !== assignment.department_id || invitation.academic_level_id !== assignment.academic_level_id || invitation.semester_id !== assignment.semester_id) {
        throw new AppError('Invitation code does not match the selected academic assignment.', 400, 'INVITATION_ASSIGNMENT_MISMATCH');
      }
    }

    // Validate student ID
    const idValidation = validateStudentId(studentId);
    if (!idValidation.valid) {
      throw new AppError(idValidation.message, 400, 'INVALID_STUDENT_ID');
    }

    // Check if student ID already exists
    const { rows: existingStudentId } = await pool.query(
      'SELECT id FROM users WHERE student_id = $1',
      [studentId]
    );
    if (existingStudentId.length > 0) {
      throw new AppError('Student ID already registered.', 409, 'STUDENT_ID_EXISTS');
    }

    const normalizedEmail = String(email || '').trim().toLowerCase() || null;
    if (normalizedEmail) {
      const { rows: existingEmail } = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existingEmail.length > 0) {
        throw new AppError('Email is already registered.', 409, 'EMAIL_EXISTS');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

// Create user
    const { rows: result } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, student_id, invitation_code, university_id_card, university_id,
              faculty_id, department_id, academic_level_id, semester_id,
              role, account_status, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        fullName.trim(),
        normalizedEmail,
        passwordHash,
        studentId,
        normalizedInvitationCode || null,
        profileImage || null,
        assignment.university_id,
        assignment.faculty_id,
        assignment.department_id,
        assignment.academic_level_id,
        assignment.semester_id,
        USER_ROLES.STUDENT,
        ACCOUNT_STATUS.PENDING,
        VERIFICATION_STATUS.PENDING
      ]
    );

    if (invitation) {
      const usage = await pool.query(
        `UPDATE invitation_codes
         SET used_count = used_count + 1
         WHERE id = $1 AND is_active = TRUE AND used_count < max_uses
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [invitation.id]
      );
      if (usage.rowCount === 0) {
        await pool.query('DELETE FROM users WHERE id = $1', [result[0].id]);
        throw new AppError('Invitation code is no longer available.', 409, 'INVITATION_UNAVAILABLE');
      }
    }

    return {
      id: result[0].id,
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

const { rows: users } = await pool.query(
  `SELECT id, full_name, email, password_hash, role, account_status, verification_status,
          rejection_reason, department_id, academic_level_id, semester_id, university_id, student_id
   FROM users
   WHERE student_id = $1 OR email = $2`,
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
  `UPDATE users
   SET refresh_token = $1,
       last_login_at = NOW()
   WHERE id = $2`,
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
      
      const { rows: users } = await pool.query(
        `SELECT id, email, role, student_id, department_id, academic_level_id,
                semester_id, account_status, verification_status
         FROM users WHERE id = $1 AND refresh_token = $2`,
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
    const { rows: users } = await pool.query(
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
       WHERE u.id = $1`,
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
    const { rows: users } = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
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
      'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    return { message: 'Password changed successfully.' };
  }

  /**
   * Logout (invalidate refresh token)
   */
  async logout(userId) {
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [userId]
    );
    return { message: 'Logged out successfully.' };
  }
}

module.exports = new AuthService();

