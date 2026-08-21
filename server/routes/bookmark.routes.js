const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');
const { authenticate, requireVerifiedStudent } = require('../middleware/auth');

// Get user bookmarks
router.get(
  '/',
  authenticate,
  requireVerifiedStudent,
  bookmarkController.getUserBookmarks
);

// Toggle bookmark (add/remove)
router.post(
  '/:resourceId',
  authenticate,
  requireVerifiedStudent,
  bookmarkController.toggleBookmark
);

module.exports = router;

