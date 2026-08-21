const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { getPagination, paginatedResponse } = require('../utils/helpers');

class BookmarkService {
  /**
   * Toggle bookmark (add/remove)
   */
  async toggle(userId, resourceId) {
    // Check if resource exists and is approved
    const [resources] = await pool.query(
      'SELECT id FROM resources WHERE id = ? AND status = ? AND is_active = 1',
      [resourceId, 'approved']
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found or not available.', 404, 'RESOURCE_NOT_FOUND');
    }

    // Check if already bookmarked
    const [existing] = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );

    if (existing.length > 0) {
      // Remove bookmark
      await pool.query(
        'DELETE FROM bookmarks WHERE user_id = ? AND resource_id = ?',
        [userId, resourceId]
      );
      return { bookmarked: false, message: 'Bookmark removed.' };
    } else {
      // Add bookmark
      await pool.query(
        'INSERT INTO bookmarks (user_id, resource_id) VALUES (?, ?)',
        [userId, resourceId]
      );
      return { bookmarked: true, message: 'Bookmark added.' };
    }
  }

  /**
   * Get user's bookmarks
   */
  async getUserBookmarks(userId, { page, limit }) {
    const { p, l, offset } = getPagination(page, limit);

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM bookmarks WHERE user_id = ?`,
      [userId]
    );

    const [bookmarks] = await pool.query(
      `SELECT b.id, b.created_at AS bookmarked_at,
              r.id AS resource_id, r.title, r.description, r.file_extension, r.file_size,
              r.download_count, r.created_at,
              u.full_name AS uploader_name,
              d.name AS department_name,
              al.name AS academic_level_name,
              s.name AS semester_name,
              COALESCE(AVG(rt.rating), 0) AS average_rating
       FROM bookmarks b
       JOIN resources r ON b.resource_id = r.id
       JOIN users u ON r.uploader_id = u.id
       JOIN departments d ON r.department_id = d.id
       JOIN academic_levels al ON r.academic_level_id = al.id
       JOIN semesters s ON r.semester_id = s.id
       LEFT JOIN ratings rt ON r.id = rt.resource_id
       WHERE b.user_id = ?
       GROUP BY b.id
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, l, offset]
    );

    return paginatedResponse(bookmarks, countResult[0].total, p, l);
  }
}

module.exports = new BookmarkService();

