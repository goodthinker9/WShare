const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, paginatedResponse } = require('../utils/helpers');

class ReportService {
  /**
   * Report a resource
   */
  async createReport(reporterId, { resourceId, reason, description }) {
    const { rows: resources } = await pool.query(
      'SELECT id FROM resources WHERE id = $1 AND is_active = TRUE',
      [resourceId]
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    }

    // Check if user already reported this resource
    const { rows: existing } = await pool.query(
      'SELECT id FROM reports WHERE reporter_id = $1 AND resource_id = $2 AND status = $3',
      [reporterId, resourceId, 'pending']
    );

    if (existing.length > 0) {
      throw new AppError('You have already reported this resource.', 409, 'ALREADY_REPORTED');
    }

    await pool.query(
      'INSERT INTO reports (reporter_id, resource_id, reason, description) VALUES ($1, $2, $3, $4)',
      [reporterId, resourceId, reason, description || null]
    );

    return { message: 'Report submitted successfully.' };
  }

  /**
   * Get reports (admin)
   */
  async getReports({ page, limit, status }) {
    const { p, l, offset } = getPagination(page, limit);

    let sql = `
      SELECT rp.id, rp.reason, rp.description, rp.status, rp.created_at,
             u.full_name AS reporter_name, u.email AS reporter_email,
             res.title AS resource_title, res.id AS resource_id
      FROM reports rp
      JOIN users u ON rp.reporter_id = u.id
      JOIN resources res ON rp.resource_id = res.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND rp.status = $${params.length + 1}`;
      params.push(status);
    }

    const countSql = sql;
    const { rows: countResult } = await pool.query(
      `SELECT COUNT(*) as total FROM (${countSql}) as sub`,
      params
    );

    sql += ` ORDER BY rp.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(l, offset);

    const { rows: reports } = await pool.query(sql, params);

    return paginatedResponse(reports, countResult[0].total, p, l);
  }

  /**
   * Resolve a report (admin)
   */
  async resolveReport(reportId, adminId, { status, adminNotes }) {
    const { rows: reports } = await pool.query(
      'SELECT id FROM reports WHERE id = $1',
      [reportId]
    );

    if (reports.length === 0) {
      throw new AppError('Report not found.', 404, 'REPORT_NOT_FOUND');
    }

    await pool.query(
      'UPDATE reports SET status = $1, resolved_by = $2, resolved_at = NOW(), admin_notes = $3 WHERE id = $4',
      [status, adminId, adminNotes || null, reportId]
    );

    // Notify the reporter
    const { rows: report } = await pool.query(
      'SELECT reporter_id FROM reports WHERE id = $1',
      [reportId]
    );

    await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
           VALUES ($1, 'report_resolved', 'Report Resolved', $2, 'report', $3)`
      [report[0].reporter_id, `Your report has been ${status}. Admin notes: ${adminNotes || 'None'}`, reportId]
    );

    return { message: 'Report resolved successfully.' };
  }
}

module.exports = new ReportService();

