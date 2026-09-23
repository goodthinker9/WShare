const pool = require('../config/database');
const { getPagination, paginatedResponse } = require('../utils/helpers');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { p, l, offset } = getPagination(req.query.page, req.query.limit);

      const { rows: countResult } = await pool.query(
        'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
        [req.user.id]
      );

      const { rows: notifications } = await pool.query(
        `SELECT id, type, title, message, reference_type, reference_id, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, l, offset]
      );

      res.json(paginatedResponse(notifications, countResult[0].total, p, l));
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const { rows: result } = await pool.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [req.user.id]
      );

      res.json({
        success: true,
        data: { unreadCount: result[0].count }
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );

      res.json({
        success: true,
        message: 'Notification marked as read.'
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = $1 AND is_read = FALSE',
        [req.user.id]
      );

      res.json({
        success: true,
        message: 'All notifications marked as read.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();

