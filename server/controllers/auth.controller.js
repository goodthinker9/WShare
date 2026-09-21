const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { fullName, email, password, studentId, invitationCode, departmentId, academicLevelId, semesterId } = req.body;
      const uploadedFile = req.files?.profileImage?.[0] || req.files?.universityIdCard?.[0];
      const profileImage = uploadedFile ? uploadedFile.path : null;

      const result = await authService.register({
        fullName,
        email,
        password,
        studentId,
        invitationCode,
        departmentId,
        academicLevelId,
        semesterId,
        profileImage
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: { userId: result.id }
      });
    } catch (error) {
      // Clean up uploaded file if registration fails
     // No cleanup needed because the image is stored in Cloudinary.
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { identifier, password } = req.body;
      const result = await authService.login({ identifier, password });

      res.json({
        success: true,
        message: 'Login successful.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await authService.logout(req.user.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

