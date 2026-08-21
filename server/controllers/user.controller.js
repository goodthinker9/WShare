const userService = require('../services/user.service');

class UserController {
  async getAll(req, res, next) {
    try {
      const result = await userService.getAll({
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        role: req.query.role,
        status: req.query.status,
        verification: req.query.verification,
        departmentId: req.query.departmentId
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyStudent(req, res, next) {
    try {
      const result = await userService.verifyStudent(req.params.id, req.user.id, {
        action: req.body.action,
        reason: req.body.reason,
        departmentId: req.body.departmentId,
        academicLevelId: req.body.academicLevelId,
        semesterId: req.body.semesterId,
        facultyId: req.body.facultyId
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await userService.updateStatus(req.params.id, req.user.id, {
        status: req.body.status,
        reason: req.body.reason
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req, res, next) {
    try {
      const result = await userService.updateAssignment(req.params.id, req.user.id, {
        departmentId: req.body.departmentId,
        academicLevelId: req.body.academicLevelId,
        semesterId: req.body.semesterId,
        facultyId: req.body.facultyId
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id, req.user.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

async getPendingVerifications(req, res, next) {
    try {
      const result = await userService.getPendingVerifications({
        page: req.query.page,
        limit: req.query.limit
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getIDCard(req, res, next) {
    try {
      const user = await userService.getById(req.params.id);
      if (!user.university_id_card) {
        return res.status(404).json({
          success: false,
          message: 'ID card not found for this user.',
          error: 'ID_CARD_NOT_FOUND'
        });
      }

      // New uploads are stored in Cloudinary; keep serving legacy local files too.
      if (/^https?:\/\//i.test(user.university_id_card)) {
        return res.redirect(user.university_id_card);
      }

      const fs = require('fs');
      const path = require('path');
      const filePath = path.resolve(user.university_id_card);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'ID card file not found on server.',
          error: 'FILE_NOT_FOUND'
        });
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
      const mime = mimeMap[ext] || 'image/jpeg';

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `inline; filename="id_card${ext}"`);
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

