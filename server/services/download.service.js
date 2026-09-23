const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, paginatedResponse } = require('../utils/helpers');

class DownloadService {
  /**
   * Record a download
   */
  async recordDownload(userId, resourceId) {
    const { rows: resources } = await pool.query(
      'SELECT id, file_path, original_file_name FROM resources WHERE id = $1 AND status = $2 AND is_active = TRUE',
      [resourceId, 'approved']
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found or not available.', 404, 'RESOURCE_NOT_FOUND');
    }

    // Record download
    await pool.query(
      'INSERT INTO downloads (user_id, resource_id) VALUES ($1, $2)',
      [userId, resourceId]
    );

    // Increment download count
    await pool.query(
      'UPDATE resources SET download_count = download_count + 1 WHERE id = $1',
      [resourceId]
    );

    return {
      message: 'Download recorded.',
      filePath: resources[0].file_path,
      originalName: resources[0].original_file_name
    };
  }

  /**
   * Get download history for a user
   */
  async getDownloadHistory(userId, { page, limit }) {
    const { p, l, offset } = getPagination(page, limit);

    const { rows: countResult } = await pool.query(
      `SELECT COUNT(*) as total FROM downloads WHERE user_id = $1`,
      [userId]
    );

    const { rows: downloads } = await pool.query(
      `SELECT d.id, d.downloaded_at,
              r.id AS resource_id, r.title, r.file_extension, r.file_size, r.download_count,
              u.full_name AS uploader_name
       FROM downloads d
       JOIN resources r ON d.resource_id = r.id
       JOIN users u ON r.uploader_id = u.id
      WHERE d.user_id = $1
       ORDER BY d.downloaded_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, l, offset]
    );

    return paginatedResponse(downloads, countResult[0].total, p, l);
  }

  /**
   * Get total download count for a resource
   */
  async getDownloadCount(resourceId) {
    const { rows: result } = await pool.query(
      'SELECT download_count FROM resources WHERE id = $1',
      [resourceId]
    );

    if (result.length === 0) {
      throw new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    }

    return { downloadCount: result[0].download_count };
  }
}

module.exports = new DownloadService();

