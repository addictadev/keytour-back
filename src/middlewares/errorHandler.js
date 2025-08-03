const CustomError = require('../utils/customError');

const errorHandler = (err, req, res, next) => {
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }
    if (err.status === 400 && err.message) {
        return res.status(400).json({
            status: 'error',
            message: err.message,
        });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];
        return res.status(400).json({
            status: 'duplicate',
            message: `Duplicate key error: The ${field} '${value}' already exists. Please use a different ${field}.`
        });
    }
    if (err.message === 'Invalid or expired OTP') {
        return res.status(400).json({
            status: 'OTP Invalid',
            message: 'The OTP you entered is invalid or has expired. Please request a new OTP and try again.'
        });
    }
    if (err.message === 'The tour does not approved yet.') {
        return res.status(400).json({
            status: 'tour still pending',
            message: 'tour still pending wait for admin approval.'
        });
    }
    
    if (err.message === 'this user already verified') {
        return res.status(400).json({
            status: 'OTP Invalid',
            message: 'this user already verified ss.'
        });
    }
    if (err.statusCode === 404) {
        return res.status(404).json({
            status: 'fail',
            message: err.message || 'Resource not found'
        });
    }
    if (err.message.startsWith('Invalid room types')) {
        return res.status(400).json({
          status: 'fail',
          message: err.message || 'Invalid room types'
        });
      }
    if (err.message === 'Invalid file type. Only JPG, JPEG, and PNG files are allowed.') {
        return res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }


    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((error) => {
            return {
                field: error.path,
                message: error.message
            };
        });

        return res.status(400).json({
            status: 'validation_error',
            message: 'Validation failed',
            errors: errors
        });
    }

    console.error("err",err);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error'
    });
};

module.exports = errorHandler;
