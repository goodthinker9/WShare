const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Middleware to check validation results from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    const error = new AppError('Validation failed.', 422, 'VALIDATION_ERROR');
    error.type = 'validation';
    error.errors = formattedErrors;
    return next(error);
  }
  next();
};

module.exports = { validate };

