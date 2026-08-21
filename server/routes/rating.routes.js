const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { authenticate, requireVerifiedStudent } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Rate/review a resource
router.post(
  '/:resourceId',
  authenticate,
  requireVerifiedStudent,
  [
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
    body('review')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Review must be at most 1000 characters.'),
  ],
  validate,
  ratingController.rateResource
);

// Get ratings for a resource
router.get(
  '/:resourceId',
  ratingController.getResourceRatings
);

// Delete a rating
router.delete(
  '/:id',
  authenticate,
  ratingController.deleteRating
);

module.exports = router;

