const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, paginatedResponse, sanitizeLike } = require('../utils/helpers');
const { RESOURCE_STATUS, USER_ROLES } = require('../utils/constants');
const path = require('path');
const fs = require('fs');

class ResourceService {
/**
   * Upload a new resource
   */
  async upload({ uploaderId, title, description, courseId, resourceTypeId, category, chapter, departmentId, academicLevelId, semesterId, file }) {
    // For students, enforce their assigned department/level/semester
    const { rows: uploader } = await pool.query(
      'SELECT role, department_id, academic_level_id, semester_id FROM users WHERE id = $1',
      [uploaderId]
    );

    if (uploader.length === 0) {
      throw new AppError('Uploader not found.', 404, 'USER_NOT_FOUND');
    }

    const user = uploader[0];
    const isAdmin = user.role === USER_ROLES.ADMIN;

    // Students use their assigned values
    const finalDepartmentId = isAdmin ? departmentId : user.department_id;
    const finalAcademicLevelId = isAdmin ? academicLevelId : user.academic_level_id;
    const finalSemesterId = isAdmin ? semesterId : user.semester_id;

    if (!finalDepartmentId || !finalAcademicLevelId || !finalSemesterId) {
      throw new AppError('Academic assignment incomplete. Cannot upload resources.', 403, 'NOT_ASSIGNED');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    
    const { rows: result } = await pool.query(
      `INSERT INTO resources (uploader_id, title, description, course_id, resource_type_id, category, chapter,
        department_id, academic_level_id, semester_id,
        file_name, original_file_name, file_path, file_size, mime_type, file_extension, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id`,
      [
        uploaderId,
        title.trim(),
        description ? description.trim() : null,
        courseId || null,
        resourceTypeId || null,
        category || 'course_material',
        chapter ? chapter.trim() : null,
        finalDepartmentId,
        finalAcademicLevelId,
        finalSemesterId,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        ext,
        isAdmin ? RESOURCE_STATUS.APPROVED : RESOURCE_STATUS.PENDING
      ]
    );

    return {
      id: result[0].id,
      status: isAdmin ? RESOURCE_STATUS.APPROVED : RESOURCE_STATUS.PENDING,
      message: isAdmin ? 'Resource uploaded successfully.' : 'Resource submitted for approval.'
    };
  }

  /**
   * Get filtered resources for student dashboard
   */
  async getDashboardResources(userId, { page, limit, category }) {
    const { rows: user } = await pool.query(
      'SELECT department_id, academic_level_id, semester_id FROM users WHERE id = $1',
      [userId]
    );

    if (user.length === 0) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const { department_id: departmentId, academic_level_id: academicLevelId, semester_id: semesterId } = user[0];
    const { page: p, limit: l, offset } = getPagination(page, limit);

    // Build base conditions for the user's department
    let whereSql = ` WHERE r.department_id = $1 AND r.status = $2 AND r.is_active = TRUE`;
    const params = [departmentId, RESOURCE_STATUS.APPROVED];

    if (semesterId) {
      whereSql += ` AND r.semester_id = $${params.length + 1}`;
      params.push(semesterId);
    }

    // If user has a specific academic level, show resources for their level and below
    if (academicLevelId) {
      whereSql += ` AND (r.academic_level_id = $${params.length + 1} OR r.academic_level_id < (SELECT display_order FROM academic_levels WHERE id = $${params.length + 2}))`;
      params.push(academicLevelId, academicLevelId);
    }

    // Optional category filter (course_material, assignment, past_exam)
    if (category) {
      whereSql += ` AND r.category = $${params.length + 1}`;
      params.push(category);
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM resources r
      ${whereSql}
    `;
    const { rows: countResult } = await pool.query(countQuery, params);
    const total = countResult[0].total;

// Main query with aggregates
    const dataQuery = `
      SELECT r.id, r.title, r.description, r.file_extension, r.file_size,
             r.download_count, r.view_count, r.created_at, r.status, r.category, r.chapter,
             u.full_name AS uploader_name,
             c.name AS course_name,
             al.name AS academic_level_name,
             s.name AS semester_name,
             rt.name AS resource_type_name,
             COALESCE(avg_ratings.avg_rating, 0) AS average_rating,
             COALESCE(avg_ratings.review_count, 0) AS review_count
      FROM resources r
      JOIN users u ON r.uploader_id = u.id
      LEFT JOIN courses c ON r.course_id = c.id
      LEFT JOIN academic_levels al ON r.academic_level_id = al.id
      LEFT JOIN semesters s ON r.semester_id = s.id
      LEFT JOIN resource_types rt ON r.resource_type_id = rt.id
      LEFT JOIN (
        SELECT resource_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
        FROM ratings
        GROUP BY resource_id
      ) avg_ratings ON r.id = avg_ratings.resource_id
      ${whereSql}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataParams = [...params, l, offset];

    const { rows: resources } = await pool.query(dataQuery, dataParams);

    return paginatedResponse(resources, total, p, l);
  }

  /**
   * Search resources
   */
  async search({ query: searchQuery, departmentId, academicLevelId, semesterId, courseId, page, limit }) {
    const { p, l, offset } = getPagination(page, limit);

    // Build base WHERE conditions
    let whereSql = ` WHERE r.status = $1 AND r.is_active = TRUE`;
    const params = [RESOURCE_STATUS.APPROVED];

    if (searchQuery) {
      const sanitized = sanitizeLike(searchQuery);
      whereSql += ` AND (r.title ILIKE $${params.length + 1} OR r.description ILIKE $${params.length + 2} OR c.name ILIKE $${params.length + 3} OR u.full_name ILIKE $${params.length + 4})`;
      params.push(`%${sanitized}%`, `%${sanitized}%`, `%${sanitized}%`, `%${sanitized}%`);
    }

    if (departmentId) {
      whereSql += ` AND r.department_id = $${params.length + 1}`;
      params.push(departmentId);
    }

    if (academicLevelId) {
      whereSql += ` AND r.academic_level_id = $${params.length + 1}`;
      params.push(academicLevelId);
    }

    if (semesterId) {
      whereSql += ` AND r.semester_id = $${params.length + 1}`;
      params.push(semesterId);
    }

    if (courseId) {
      whereSql += ` AND r.course_id = $${params.length + 1}`;
      params.push(courseId);
    }

    // Count query (no aggregate - counts rows directly)
    const countSql = `
      SELECT COUNT(*) as total
      FROM resources r
      JOIN users u ON r.uploader_id = u.id
      JOIN departments d ON r.department_id = d.id
      JOIN academic_levels al ON r.academic_level_id = al.id
      JOIN semesters s ON r.semester_id = s.id
      LEFT JOIN courses c ON r.course_id = c.id
      ${whereSql}
    `;
    const { rows: countResult } = await pool.query(countSql, params);
    const total = countResult[0].total;

// Main query with aggregates (GROUP BY r.id for ONLY_FULL_GROUP_BY compliance)
    const dataSql = `
      SELECT r.id, r.title, r.description, r.file_extension, r.file_size,
             r.download_count, r.created_at, r.category, r.chapter,
             u.full_name AS uploader_name,
             d.name AS department_name,
             al.name AS academic_level_name,
             s.name AS semester_name,
             c.name AS course_name,
             COALESCE(AVG(rtg.rating), 0) AS average_rating,
             COUNT(DISTINCT rtg.id) AS review_count
      FROM resources r
      JOIN users u ON r.uploader_id = u.id
      JOIN departments d ON r.department_id = d.id
      JOIN academic_levels al ON r.academic_level_id = al.id
      JOIN semesters s ON r.semester_id = s.id
      LEFT JOIN courses c ON r.course_id = c.id
      LEFT JOIN ratings rtg ON r.id = rtg.resource_id
      ${whereSql}
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const dataParams = [...params, l, offset];

    const { rows: resources } = await pool.query(dataSql, dataParams);

    return paginatedResponse(resources, total, p, l);
  }

  /**
   * Get single resource details
   */
  async getById(resourceId) {
    const { rows: resources } = await pool.query(
      `SELECT r.*, u.full_name AS uploader_name, u.profile_image AS uploader_image,
              d.name AS department_name, al.name AS academic_level_name,
              s.name AS semester_name, c.name AS course_name, c.code AS course_code,
              rt.name AS resource_type_name
       FROM resources r
       JOIN users u ON r.uploader_id = u.id
       LEFT JOIN departments d ON r.department_id = d.id
       LEFT JOIN academic_levels al ON r.academic_level_id = al.id
       LEFT JOIN semesters s ON r.semester_id = s.id
       LEFT JOIN courses c ON r.course_id = c.id
       LEFT JOIN resource_types rt ON r.resource_type_id = rt.id
      WHERE r.id = $1`,
      [resourceId]
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    }

    // Increment view count
    await pool.query(
      'UPDATE resources SET view_count = view_count + 1 WHERE id = $1',
      [resourceId]
    );

    return resources[0];
  }

/**
   * Update resource (admin only)
   */
  async update(resourceId, { title, description, courseId, category, chapter, departmentId, academicLevelId, semesterId }) {
    const { rows: resources } = await pool.query(
      'SELECT id FROM resources WHERE id = $1',
      [resourceId]
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    }

    const updates = [];
    const params = [];

    if (title) {
      updates.push(`title = $${params.length + 1}`);
      params.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${params.length + 1}`);
      params.push(description ? description.trim() : null);
    }
    if (courseId) {
      updates.push(`course_id = $${params.length + 1}`);
      params.push(courseId);
    }
    if (category) {
      updates.push(`category = $${params.length + 1}`);
      params.push(category);
    }
    if (chapter !== undefined) {
      updates.push(`chapter = $${params.length + 1}`);
      params.push(chapter ? chapter.trim() : null);
    }
    if (departmentId) {
      updates.push(`department_id = $${params.length + 1}`);
      params.push(departmentId);
    }
    if (academicLevelId) {
      updates.push(`academic_level_id = $${params.length + 1}`);
      params.push(academicLevelId);
    }
    if (semesterId) {
      updates.push(`semester_id = $${params.length + 1}`);
      params.push(semesterId);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update.', 400, 'NO_UPDATES');
    }

    params.push(resourceId);
    await pool.query(
      `UPDATE resources SET ${updates.join(', ')} WHERE id = $${params.length + 1}`,
      params
    );

    return { message: 'Resource updated successfully.' };
  }

  /**
   * Delete resource
   */
  async delete(resourceId) {
    const { rows: resources } = await pool.query(
      'SELECT id, file_path FROM resources WHERE id = $1',
      [resourceId]
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    }

    // Soft delete
    await pool.query(
      'UPDATE resources SET is_active = FALSE WHERE id = $1',
      [resourceId]
    );

    return { message: 'Resource deleted successfully.' };
  }

  /**
   * Approve or reject resource (admin)
   */
  async review(resourceId, { status, rejectionReason, reviewerId }) {
    const { rows: resources } = await pool.query(
      'SELECT id, uploader_id FROM resources WHERE id = $1',
      [resourceId]
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    }

    if (status === RESOURCE_STATUS.REJECTED && !rejectionReason) {
      throw new AppError('Rejection reason is required.', 400, 'REASON_REQUIRED');
    }

    await pool.query(
      `UPDATE resources SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4`,
      [status, rejectionReason || null, reviewerId, resourceId]
    );

    // Create notification for uploader
    const notificationType = status === RESOURCE_STATUS.APPROVED ? 'resource_approved' : 'resource_rejected';
    const notificationTitle = status === RESOURCE_STATUS.APPROVED ? 'Resource Approved' : 'Resource Rejected';
    const notificationMessage = status === RESOURCE_STATUS.APPROVED
      ? 'Your uploaded resource has been approved and is now visible to students.'
      : `Your uploaded resource has been rejected. Reason: ${rejectionReason}`;

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
      VALUES ($1, $2, $3, $4, 'resource', $5)`,
      [resources[0].uploader_id, notificationType, notificationTitle, notificationMessage, resourceId]
    );

    return {
      message: `Resource ${status} successfully.`,
      status
    };
  }

  /**
   * Get pending resources (admin)
   */
  async getPendingResources({ page, limit }) {
    const { p, l, offset } = getPagination(page, limit);

    const { rows: countResult } = await pool.query(
      `SELECT COUNT(*) as total FROM resources WHERE status = $1 AND is_active = TRUE`,
      [RESOURCE_STATUS.PENDING]
    );

    const { rows: resources } = await pool.query(
      `SELECT r.id, r.title, r.description, r.file_extension, r.file_size, r.created_at,
              u.full_name AS uploader_name, u.email AS uploader_email,
              d.name AS department_name, al.name AS academic_level_name, s.name AS semester_name
       FROM resources r
       JOIN users u ON r.uploader_id = u.id
       LEFT JOIN departments d ON r.department_id = d.id
       LEFT JOIN academic_levels al ON r.academic_level_id = al.id
       LEFT JOIN semesters s ON r.semester_id = s.id
      WHERE r.status = $1 AND r.is_active = TRUE
       ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3`,
      [RESOURCE_STATUS.PENDING, l, offset]
    );

    return paginatedResponse(resources, countResult[0].total, p, l);
  }

  /**
   * Get file info for preview/stream (admin can preview any resource, students only approved)
   */
  async getFileForPreview(resourceId, role) {
    const { rows: resources } = await pool.query(
      'SELECT id, file_path, original_file_name, mime_type, file_extension, status FROM resources WHERE id = $1 AND is_active = TRUE',
      [resourceId]
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    }

    const resource = resources[0];

    // Students can only preview approved resources
    if (role !== 'admin' && resource.status !== 'approved') {
      throw new AppError('Resource not available.', 403, 'RESOURCE_NOT_AVAILABLE');
    }

    return resource;
  }

  /**
   * Get all resources with filters (admin)
   */
  async getAllResources({ page, limit, status, search, departmentId, category }) {
    const { p, l, offset } = getPagination(page, limit);

let sql = `
      SELECT r.id, r.title, r.description, r.file_extension, r.file_size,
             r.download_count, r.view_count, r.created_at, r.status, r.category, r.chapter,
             r.department_id, r.academic_level_id, r.semester_id, r.course_id,
             u.full_name AS uploader_name, u.email AS uploader_email,
             d.name AS department_name,
             al.name AS academic_level_name,
             s.name AS semester_name,
             c.name AS course_name,
             COALESCE(avg_ratings.avg_rating, 0) AS average_rating,
             COALESCE(avg_ratings.review_count, 0) AS review_count
      FROM resources r
      JOIN users u ON r.uploader_id = u.id
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN academic_levels al ON r.academic_level_id = al.id
      LEFT JOIN semesters s ON r.semester_id = s.id
      LEFT JOIN courses c ON r.course_id = c.id
      LEFT JOIN (
        SELECT resource_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
        FROM ratings
        GROUP BY resource_id
      ) avg_ratings ON r.id = avg_ratings.resource_id
      WHERE r.is_active = TRUE
    `;
    const params = [];

    if (status) {
      sql += ` AND r.status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      const sanitized = sanitizeLike(search);
      sql += ` AND (r.title ILIKE $${params.length + 1} OR r.description ILIKE $${params.length + 2} OR u.full_name ILIKE $${params.length + 3})`;
      params.push(`%${sanitized}%`, `%${sanitized}%`, `%${sanitized}%`);
    }

    if (departmentId) {
      sql += ` AND r.department_id = $${params.length + 1}`;
      params.push(departmentId);
    }

    if (category) {
      sql += ` AND r.category = $${params.length + 1}`;
      params.push(category);
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as sub`;
    const { rows: countResult } = await pool.query(countSql, params);
    const total = countResult[0].total;

    sql += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(l, offset);

    const { rows: resources } = await pool.query(sql, params);

    return paginatedResponse(resources, total, p, l);
  }
}

module.exports = new ResourceService();

