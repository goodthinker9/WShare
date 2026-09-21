const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const controller = require('../controllers/invitationCode.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('admin'));
router.get('/', controller.list);
router.post('/', [
  body('facultyId').isInt({ min: 1 }),
  body('departmentId').isInt({ min: 1 }),
  body('academicLevelId').isInt({ min: 1 }),
  body('semesterId').isInt({ min: 1 }),
  body('maxUses').isInt({ min: 1, max: 10000 }),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Expiration must be a valid date.')
], validate, controller.create);
router.put('/:id/disable', controller.disable);
router.delete('/:id', controller.delete);

module.exports = router;