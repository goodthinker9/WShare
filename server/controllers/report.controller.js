const reportService = require('../services/report.service');

class ReportController {
  async createReport(req, res, next) {
    try {
      const result = await reportService.createReport(req.user.id, {
        resourceId: req.body.resourceId,
        reason: req.body.reason,
        description: req.body.description
      });

      res.status(201).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const result = await reportService.getReports({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req, res, next) {
    try {
      const result = await reportService.resolveReport(req.params.id, req.user.id, {
        status: req.body.status,
        adminNotes: req.body.adminNotes
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();

