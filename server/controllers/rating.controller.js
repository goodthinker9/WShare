const ratingService = require('../services/rating.service');

class RatingController {
  async rateResource(req, res, next) {
    try {
      const result = await ratingService.rateResource(req.user.id, req.params.resourceId, {
        rating: req.body.rating,
        review: req.body.review
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getResourceRatings(req, res, next) {
    try {
      const result = await ratingService.getResourceRatings(req.params.resourceId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRating(req, res, next) {
    try {
      const result = await ratingService.deleteRating(req.user.id, req.params.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RatingController();

