const downloadService = require('../services/download.service');
const path = require('path');

class DownloadController {
  async download(req, res, next) {
    try {
      const result = await downloadService.recordDownload(req.user.id, req.params.resourceId);

      // Serve the file
      const absolutePath = path.resolve(result.filePath);
      res.download(absolutePath, result.originalName, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error downloading file.',
              error: 'DOWNLOAD_ERROR'
            });
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const result = await downloadService.getDownloadHistory(req.user.id, {
        page: req.query.page,
        limit: req.query.limit
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DownloadController();

