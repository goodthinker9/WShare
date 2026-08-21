const adminService = require('../services/admin.service');

class AnalyticsController {
  async getDashboardStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getCharts(req, res, next) {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [studentGrowth, downloadTrends, uploadTrends] = await Promise.all([
        adminService.getStudentGrowth(startDate, endDate),
        adminService.getDownloadTrends(startDate, endDate),
        adminService.getUploadTrends(startDate, endDate)
      ]);

      res.json({
        success: true,
        data: {
          studentGrowth,
          downloadTrends,
          uploadTrends
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopResources(req, res, next) {
    try {
      const resources = await adminService.getMostDownloadedResources(10);

      res.json({
        success: true,
        data: resources
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveStudents(req, res, next) {
    try {
      const students = await adminService.getMostActiveStudents(10);

      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      next(error);
    }
  }

  async getVerificationStats(req, res, next) {
    try {
      const stats = await adminService.getVerificationStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentStats(req, res, next) {
    try {
      const stats = await adminService.getDepartmentStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivities(req, res, next) {
    try {
      const activities = await adminService.getRecentActivities(20);

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();

