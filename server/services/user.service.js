const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, paginatedResponse } = require('../utils/helpers');
const { ACCOUNT_STATUS, VERIFICATION_STATUS, VERIFICATION_ACTIONS } = require('../utils/constants');

class UserService {
  /**
   * Get all users with filters (admin)
   */
  async getAll({ page, limit, search, role, status, verification, departmentId }) {
    const { p, l, offset } = getPagination(page, limit);

    let sql = `
      SELECT u.id, u.full_name, u.email, u.student_id, u.role,
             u.account_status, u.verification_status, u.created_at,
             d.name AS department_name,
             al.name AS academic_level_name,
             s.name AS semester_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN academic_levels al ON u.academic_level_id = al.id
      LEFT JOIN semesters s ON u.semester_id = s.id
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (search) {
      sql += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (role) {
      sql += ` AND u.role = ?`;
      params.push(role);
      countParams.push(role);
    }

    if (status) {
      sql += ` AND u.account_status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (verification) {
      sql += ` AND u.verification_status = ?`;
      params.push(verification);
      countParams.push(verification);
    }

    if (departmentId) {
      sql += ` AND u.department_id = ?`;
      params.push(departmentId);
      countParams.push(departmentId);
    }

    // Count
    const countSql = `SELECT COUNT(*) as total FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE 1=1` +
      (search ? ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.student_id LIKE ?)` : '') +
      (role ? ` AND u.role = ?` : '') +
      (status ? ` AND u.account_status = ?` : '') +
      (verification ? ` AND u.verification_status = ?` : '') +
      (departmentId ? ` AND u.department_id = ?` : '');

    const [countResult] = await pool.query(countSql, countParams);
    const total = countResult[0].total;

    sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(l, offset);

    const [users] = await pool.query(sql, params);

    return paginatedResponse(users, total, p, l);
  }

  /**
   * Get single user details
   */
  async getById(userId) {
    const [users] = await pool.query(
      `SELECT u.*, d.name AS department_name, al.name AS academic_level_name,
              s.name AS semester_name, un.name AS university_name, f.name AS faculty_name
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
   * Verify (approve/reject) a student
   */
async verifyStudent(userId, adminId, { action, reason, departmentId, academicLevelId, semesterId, facultyId }) {
    const [users] = await pool.query(
      'SELECT id, role, verification_status, department_id, academic_level_id, semester_id, faculty_id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (users[0].role !== 'student') {
      throw new AppError('Only student accounts can be verified.', 400, 'NOT_STUDENT');
    }

    if (action === VERIFICATION_ACTIONS.APPROVED) {
      // Use the student's declared academic info (from registration) if provided.
      // Admin simply verifies the student based on the university ID card.
      const finalDept = departmentId || users[0].department_id;
      const finalLevel = academicLevelId || users[0].academic_level_id;
      const finalSemester = semesterId || users[0].semester_id;
      const finalFaculty = facultyId || users[0].faculty_id;

      await pool.query(
        `UPDATE users SET verification_status = ?, account_status = ?, verified_by = ?, verified_at = NOW(),
                department_id = ?, academic_level_id = ?, semester_id = ?, faculty_id = ?,
                rejection_reason = NULL
         WHERE id = ?`,
        [VERIFICATION_STATUS.APPROVED, ACCOUNT_STATUS.ACTIVE, adminId, finalDept, finalLevel, finalSemester, finalFaculty || null, userId]
      );

      // Create notification
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES (?, 'verification_approved', 'Verification Approved', 'Your account has been verified. You can now login and access resources.')`,
        [userId]
      );
} else if (action === VERIFICATION_ACTIONS.REJECTED) {
      if (!reason) {
        throw new AppError('Rejection reason is required.', 400, 'REASON_REQUIRED');
      }

      // On rejection, keep the student's declared academic info preserved so that
      // a resubmitted student's declared info remains available for the admin to
      // approve later. The declared info is NOT "active/authorized" while the
      // account is rejected/pending — resource access is blocked by the
      // requireVerifiedStudent middleware (which re-checks DB status) and by the
      // login restriction. The verification record (student_verifications) and
      // rejection_reason are preserved for audit/history.
      await pool.query(
        `UPDATE users SET verification_status = ?, account_status = ?, verified_by = ?, verified_at = NOW(),
                rejection_reason = ?
         WHERE id = ?`,
        [VERIFICATION_STATUS.REJECTED, ACCOUNT_STATUS.PENDING, adminId, reason, userId]
      );

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
         VALUES (?, 'verification_rejected', 'Verification Rejected', ?, 'verification', ?)`,
        [userId, `Your account verification was rejected. Reason: ${reason}`, userId]
      );
    }

    // Log to student_verifications
    await pool.query(
      `INSERT INTO student_verifications (user_id, admin_id, action, reason)
       VALUES (?, ?, ?, ?)`,
      [userId, adminId, action, reason]
    );

    // Log to audit
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'user', ?, ?)`,
      [adminId, `student_${action}`, userId, `Student ${action}: ${users[0].id}`]
    );

    return {
      message: `Student ${action} successfully.`
    };
  }

  /**
   * Update user status (suspend, activate, disable)
   */
  async updateStatus(userId, adminId, { status, reason }) {
    const [users] = await pool.query(
      'SELECT id, account_status FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const validStatuses = [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.DISABLED];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid account status.', 400, 'INVALID_STATUS');
    }

    await pool.query(
      'UPDATE users SET account_status = ? WHERE id = ?',
      [status, userId]
    );

    // Log
    const actionMap = {
      [ACCOUNT_STATUS.SUSPENDED]: 'suspended',
      [ACCOUNT_STATUS.ACTIVE]: 'activated',
      [ACCOUNT_STATUS.DISABLED]: 'disabled'
    };

    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
       VALUES (?, ?, 'user', ?, ?)`,
      [adminId, `user_${actionMap[status]}`, userId, reason || `User ${actionMap[status]}`]
    );

    // Create notification
    const titleMap = {
      [ACCOUNT_STATUS.SUSPENDED]: 'Account Suspended',
      [ACCOUNT_STATUS.ACTIVE]: 'Account Activated',
      [ACCOUNT_STATUS.DISABLED]: 'Account Disabled'
    };

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'system', ?, ?)`,
      [userId, titleMap[status], reason || `Your account has been ${actionMap[status]}.`]
    );

    return { message: `User ${actionMap[status]} successfully.` };
  }

  /**
   * Delete user
   */
  async deleteUser(userId, adminId) {
    const [users] = await pool.query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (users[0].role === 'admin') {
      throw new AppError('Cannot delete admin accounts.', 403, 'CANNOT_DELETE_ADMIN');
    }

    await pool.query('DELETE FROM users WHERE id = ?', [userId]);

    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
       VALUES (?, 'user_deleted', 'user', ?, 'User deleted')`,
      [adminId, userId]
    );

    return { message: 'User deleted successfully.' };
  }

  /**
   * Get pending verification students
   */
  async getPendingVerifications({ page, limit }) {
    const { p, l, offset } = getPagination(page, limit);

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users WHERE verification_status = ? AND role = 'student'`,
      [VERIFICATION_STATUS.PENDING]
    );

    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.student_id, u.university_id_card, u.created_at
       FROM users u
       WHERE u.verification_status = ? AND u.role = 'student'
       ORDER BY u.created_at ASC
       LIMIT ? OFFSET ?`,
      [VERIFICATION_STATUS.PENDING, l, offset]
    );

    return paginatedResponse(users, countResult[0].total, p, l);
  }

  /**
   * Update user assignment
   */
  async updateAssignment(userId, adminId, { departmentId, academicLevelId, semesterId, facultyId }) {
    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    await pool.query(
      `UPDATE users SET department_id = ?, academic_level_id = ?, semester_id = ?, faculty_id = ?
       WHERE id = ?`,
      [departmentId || null, academicLevelId || null, semesterId || null, facultyId || null, userId]
    );

    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description)
       VALUES (?, 'assignment_updated', 'user', ?, 'Academic assignment updated')`,
      [adminId, userId]
    );

    return { message: 'User assignment updated successfully.' };
  }
}

module.exports = new UserService();

