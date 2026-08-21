const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class RatingService {
  /**
   * Rate and/or review a resource
   */
  async rateResource(userId, resourceId, { rating, review }) {
    // Check if resource exists and is approved
    const [resources] = await pool.query(
      'SELECT id, uploader_id FROM resources WHERE id = ? AND status = ? AND is_active = 1',
      [resourceId, 'approved']
    );

    if (resources.length === 0) {
      throw new AppError('Resource not found or not available.', 404, 'RESOURCE_NOT_FOUND');
    }

    // Cannot rate own resource
    if (resources[0].uploader_id === userId) {
      throw new AppError('You cannot rate your own resource.', 403, 'SELF_RATING');
    }

    // Check if user has already rated
    const [existing] = await pool.query(
      'SELECT id FROM ratings WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );

    if (existing.length > 0) {
      // Update existing rating
      await pool.query(
        'UPDATE ratings SET rating = ?, review = ?, is_edited = 1, updated_at = NOW() WHERE id = ?',
        [rating, review || null, existing[0].id]
      );
      return { message: 'Rating updated successfully.' };
    } else {
      // Create new rating
      await pool.query(
        'INSERT INTO ratings (user_id, resource_id, rating, review) VALUES (?, ?, ?, ?)',
        [userId, resourceId, rating, review || null]
      );
      return { message: 'Rating submitted successfully.' };
    }
  }

  /**
   * Get ratings for a resource
   */
  async getResourceRatings(resourceId) {
    const [ratings] = await pool.query(
      `SELECT r.id, r.rating, r.review, r.created_at, r.updated_at,
              u.id AS user_id, u.full_name, u.profile_image
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.resource_id = ?
       ORDER BY r.created_at DESC`,
      [resourceId]
    );

    // Calculate average
    const [avgResult] = await pool.query(
      'SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings FROM ratings WHERE resource_id = ?',
      [resourceId]
    );

    return {
      ratings,
      averageRating: parseFloat(avgResult[0].average_rating) || 0,
      totalRatings: avgResult[0].total_ratings
    };
  }

  /**
   * Delete a rating
   */
  async deleteRating(userId, ratingId) {
    const [ratings] = await pool.query(
      'SELECT id FROM ratings WHERE id = ? AND user_id = ?',
      [ratingId, userId]
    );

    if (ratings.length === 0) {
      throw new AppError('Rating not found.', 404, 'RATING_NOT_FOUND');
    }

    await pool.query('DELETE FROM ratings WHERE id = ?', [ratingId]);
    return { message: 'Rating deleted successfully.' };
  }
}

module.exports = new RatingService();

