const bookmarkService = require('../services/bookmark.service');

class BookmarkController {
  async toggleBookmark(req, res, next) {
    try {
      const result = await bookmarkService.toggle(req.user.id, req.params.resourceId);

      res.json({
        success: true,
        message: result.message,
        data: { bookmarked: result.bookmarked }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserBookmarks(req, res, next) {
    try {
      const result = await bookmarkService.getUserBookmarks(req.user.id, {
        page: req.query.page,
        limit: req.query.limit
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookmarkController();

