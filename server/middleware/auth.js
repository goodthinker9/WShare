const jwt = require('jsonwebtoken');
const config = require('../config');
const pool = require('../config/database');
const { AppError } = require('./errorHandler');

/**
 * Verify JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      studentId: decoded.studentId,
      departmentId: decoded.departmentId,
      academicLevelId: decoded.academicLevelId,
      semesterId: decoded.semesterId,
      verificationStatus: decoded.verificationStatus,
      accountStatus: decoded.accountStatus
    };
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(error);
  }
};

/**
 * Check if user has required role(s)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_REQUIRED'));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Access denied. Insufficient permissions.', 403, 'FORBIDDEN'));
    }
    
    next();
  };
};

/**
 * Check if student account is verified and active.
 * Re-validates the student's current status directly from the database so that
 * stale JWT claims (e.g. a token minted before the student was rejected) cannot
 * be used to bypass verification. This enforces the business rule:
 *
 *   Pending  -> no academic resource access
 *   Approved -> active academic information + authorized resources
 *   Rejected -> no academic resource access
 */
const requireVerifiedStudent = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      // Fetch fresh status + assignment from the DB to avoid stale-token bypass.
      const [rows] = await pool.query(
        'SELECT account_status, verification_status, department_id, academic_level_id, semester_id FROM users WHERE id = ?',
        [req.user.id]
      );

      if (rows.length === 0) {
        return next(new AppError('Account not found.', 404, 'USER_NOT_FOUND'));
      }

      const user = rows[0];

      if (user.account_status !== 'active') {
        if (user.verification_status === 'rejected') {
          return next(new AppError('Your verification was rejected. Please correct and resubmit your information.', 403, 'VERIFICATION_REJECTED'));
        }
        return next(new AppError('Account is not active.', 403, 'ACCOUNT_INACTIVE'));
      }

      if (user.verification_status !== 'approved') {
        return next(new AppError('Account not verified.', 403, 'NOT_VERIFIED'));
      }

      // A verified/active student must have an approved academic assignment.
      if (!user.department_id || !user.academic_level_id || !user.semester_id) {
        return next(new AppError('Academic assignment not complete. Contact admin.', 403, 'NOT_ASSIGNED'));
      }

      // Refresh req.user with the authoritative DB values so downstream code
      // (resource filtering, uploads) uses the approved assignment, not stale token data.
      req.user.accountStatus = user.account_status;
      req.user.verificationStatus = user.verification_status;
      req.user.departmentId = user.department_id;
      req.user.academicLevelId = user.academic_level_id;
      req.user.semesterId = user.semester_id;
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has assigned department/level/semester
 */
const requireAssignment = (req, res, next) => {
  if (!req.user.departmentId || !req.user.academicLevelId || !req.user.semesterId) {
    return next(new AppError('Academic assignment not complete. Contact admin.', 403, 'NOT_ASSIGNED'));
  }
  next();
};

module.exports = { authenticate, authorize, requireVerifiedStudent, requireAssignment };

