const pool = require('../config/database');

class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats() {
    const { rows: totalStudents } = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = TRUE`
    );

    const { rows: verifiedStudents } = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'student' AND verification_status = 'approved' AND is_active = TRUE`
    );

    const { rows: pendingVerifications } = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'student' AND verification_status = 'pending' AND is_active = TRUE`
    );

    const { rows: pendingResources } = await pool.query(
      `SELECT COUNT(*) as count FROM resources WHERE status = 'pending' AND is_active = TRUE`
    );

    const { rows: approvedResources } = await pool.query(
      `SELECT COUNT(*) as count FROM resources WHERE status = 'approved' AND is_active = TRUE`
    );

    const { rows: totalDownloads } = await pool.query(
      `SELECT COUNT(*) as count FROM downloads`
    );

    const { rows: totalBookmarks } = await pool.query(
      `SELECT COUNT(*) as count FROM bookmarks`
    );

    const { rows: pendingReports } = await pool.query(
      `SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`
    );

    const { rows: totalNotifications } = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE`
    );

    return {
      totalStudents: totalStudents[0].count,
      verifiedStudents: verifiedStudents[0].count,
      pendingVerifications: pendingVerifications[0].count,
      pendingResources: pendingResources[0].count,
      approvedResources: approvedResources[0].count,
      totalDownloads: totalDownloads[0].count,
      totalBookmarks: totalBookmarks[0].count,
      pendingReports: pendingReports[0].count,
      unreadNotifications: totalNotifications[0].count
    };
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit = 10) {
    const { rows: activities } = await pool.query(
      `(SELECT 'registration' as type, u.created_at, u.full_name, NULL as resource_title
        FROM users u WHERE u.role = 'student'
        ORDER BY u.created_at DESC LIMIT $1)
       UNION ALL
       (SELECT 'resource_upload' as type, r.created_at, u.full_name, r.title
        FROM resources r JOIN users u ON r.uploader_id = u.id
        ORDER BY r.created_at DESC LIMIT $2)
       UNION ALL
       (SELECT 'download' as type, d.downloaded_at, u.full_name, r.title
        FROM downloads d JOIN users u ON d.user_id = u.id JOIN resources r ON d.resource_id = r.id
        ORDER BY d.downloaded_at DESC LIMIT $3)
             ORDER BY created_at DESC LIMIT $4`,
      [limit, limit, limit, limit]
    );

    return activities;
  }

  /**
   * Get chart data for analytics
   */
  async getStudentGrowth(startDate, endDate) {
    const { rows: data } = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users WHERE role = 'student' AND created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return data;
  }

  async getDownloadTrends(startDate, endDate) {
    const { rows: data } = await pool.query(
      `SELECT DATE(downloaded_at) as date, COUNT(*) as count
      FROM downloads WHERE downloaded_at BETWEEN $1 AND $2
       GROUP BY DATE(downloaded_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return data;
  }

  async getUploadTrends(startDate, endDate) {
    const { rows: data } = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
      FROM resources WHERE created_at BETWEEN $1 AND $2
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return data;
  }

  async getMostDownloadedResources(limit = 10) {
    const { rows: data } = await pool.query(
      `SELECT r.id, r.title, r.download_count, r.file_extension,
              u.full_name AS uploader_name, d.name AS department_name
       FROM resources r
       JOIN users u ON r.uploader_id = u.id
       JOIN departments d ON r.department_id = d.id
      WHERE r.is_active = TRUE
       ORDER BY r.download_count DESC
      LIMIT $1`,
      [limit]
    );
    return data;
  }

  async getMostActiveStudents(limit = 10) {
    const { rows: data } = await pool.query(
      `SELECT u.id, u.full_name, u.student_id,
              COUNT(DISTINCT r.id) as uploads,
              COUNT(DISTINCT d.id) as downloads,
              COUNT(DISTINCT b.id) as bookmarks
       FROM users u
       LEFT JOIN resources r ON u.id = r.uploader_id
       LEFT JOIN downloads d ON u.id = d.user_id
       LEFT JOIN bookmarks b ON u.id = b.user_id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY (uploads + downloads + bookmarks) DESC
      LIMIT $1`,
      [limit]
    );
    return data;
  }

  async getVerificationStatistics() {
    const { rows: data } = await pool.query(
      `SELECT verification_status, COUNT(*) as count
       FROM users WHERE role = 'student'
       GROUP BY verification_status`
    );
    return data;
  }

  async getDepartmentStatistics() {
    const { rows: data } = await pool.query(
      `SELECT d.name, COUNT(u.id) as student_count, COUNT(r.id) as resource_count
       FROM departments d
       LEFT JOIN users u ON d.id = u.department_id
       LEFT JOIN resources r ON d.id = r.department_id
       GROUP BY d.id
       ORDER BY student_count DESC`
    );
    return data;
  }
}

module.exports = new AdminService();

