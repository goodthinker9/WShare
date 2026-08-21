const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload, handleUploadError } = require('../middleware/upload');
const uploadStudentId = require("../middleware/uploadStudentId");
// Validation rules
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 255 }).withMessage('Full name must be 2-255 characters.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).withMessage('Password must contain uppercase, lowercase, number, and special character.'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
  body('studentId')
    .trim()
    .notEmpty().withMessage('Student ID is required.'),
body('departmentId')
    .notEmpty().withMessage('Department is required.')
    .isInt().withMessage('Department must be a valid ID.'),
  body('academicLevelId')
    .notEmpty().withMessage('Academic level is required.')
    .isInt().withMessage('Academic level must be a valid ID.'),
  body('semesterId')
    .notEmpty().withMessage('Semester is required.')
    .isInt().withMessage('Semester must be a valid ID.')
];

const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Student ID is required.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/).withMessage('Password must contain uppercase, lowercase, number, and special character.'),
  body('confirmNewPassword')
    .notEmpty().withMessage('Confirm new password is required.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match.');
      }
      return true;
    })
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required.')
];

// Routes

router.post(
  "/register",
  uploadStudentId.single("universityIdCard"),
  authController.register
);

router.post(
  '/login',
  loginValidation,
  validate,
  authController.login
);

router.post(
  '/refresh-token',
  refreshTokenValidation,
  validate,
  authController.refreshToken
);

router.get(
  '/me',
  authenticate,
  authController.getProfile
);

router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

module.exports = router;

