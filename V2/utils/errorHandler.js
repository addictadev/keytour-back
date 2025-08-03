/**
 * Enhanced Error Handler - Comprehensive error handling for RBAC system
 * 
 * Features:
 * - Centralized error handling
 * - Security-focused error responses
 * - Detailed logging
 * - Error categorization
 * - Performance monitoring
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const CustomError = require('../../src/utils/customError');
const response = require('../../src/utils/response');

class ErrorHandler {
    /**
     * Main error handling middleware
     * @param {Error} err - Error object
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Next middleware function
     */
    static handle(err, req, res, next) {
        // Log error for debugging
        ErrorHandler.logError(err, req);

        // Determine error type and create appropriate response
        const errorResponse = ErrorHandler.createErrorResponse(err, req);

        // Send response
        response(res, errorResponse.statusCode, null, errorResponse.message, errorResponse.details);
    }

    /**
     * Create standardized error response
     * @param {Error} err - Error object
     * @param {Object} req - Express request object
     * @returns {Object} - Error response object
     */
    static createErrorResponse(err, req) {
        // Default error response
        let statusCode = 500;
        let message = 'Internal server error';
        let details = null;

        // Handle different error types
        if (err instanceof CustomError) {
            statusCode = err.statusCode;
            message = err.message;
            details = err.details || null;
        } else if (err.name === 'ValidationError') {
            // Mongoose validation errors
            statusCode = 400;
            message = 'Validation failed';
            details = ErrorHandler.extractValidationErrors(err);
        } else if (err.name === 'CastError') {
            // MongoDB cast errors (invalid ObjectId, etc.)
            statusCode = 400;
            message = 'Invalid data format';
            details = { field: err.path, value: err.value };
        } else if (err.code === 11000) {
            // MongoDB duplicate key errors
            statusCode = 409;
            message = 'Duplicate entry';
            details = ErrorHandler.extractDuplicateKeyError(err);
        } else if (err.name === 'JsonWebTokenError') {
            // JWT errors
            statusCode = 401;
            message = 'Invalid token';
        } else if (err.name === 'TokenExpiredError') {
            // JWT expiration errors
            statusCode = 401;
            message = 'Token has expired';
        } else if (err.name === 'MongoNetworkError') {
            // Database connection errors
            statusCode = 503;
            message = 'Database connection error';
        } else if (err.name === 'MongoTimeoutError') {
            // Database timeout errors
            statusCode = 503;
            message = 'Database operation timeout';
        } else if (err.type === 'entity.too.large') {
            // Request entity too large
            statusCode = 413;
            message = 'Request payload too large';
        } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
            // JSON parsing errors
            statusCode = 400;
            message = 'Invalid JSON format';
        } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            // Network errors
            statusCode = 503;
            message = 'Service temporarily unavailable';
        }

        // In production, don't expose sensitive error details
        if (process.env.NODE_ENV === 'production') {
            details = ErrorHandler.sanitizeErrorDetails(details, statusCode);
        }

        return { statusCode, message, details };
    }

    /**
     * Extract validation errors from Mongoose
     * @param {Error} err - Mongoose validation error
     * @returns {Object} - Formatted validation errors
     */
    static extractValidationErrors(err) {
        const errors = {};
        
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                const error = err.errors[key];
                errors[key] = error.message;
            });
        }

        return { validationErrors: errors };
    }

    /**
     * Extract duplicate key error information
     * @param {Error} err - MongoDB duplicate key error
     * @returns {Object} - Formatted duplicate key error
     */
    static extractDuplicateKeyError(err) {
        const keyValue = err.keyValue || {};
        const keys = Object.keys(keyValue);
        
        return {
            duplicateField: keys[0] || 'unknown',
            duplicateValue: keyValue[keys[0]] || 'unknown'
        };
    }

    /**
     * Sanitize error details for production
     * @param {Object} details - Error details
     * @param {Number} statusCode - HTTP status code
     * @returns {Object} - Sanitized details
     */
    static sanitizeErrorDetails(details, statusCode) {
        // Only show details for client errors (4xx), not server errors (5xx)
        if (statusCode >= 500) {
            return null;
        }

        // Remove sensitive information
        if (details && typeof details === 'object') {
            const sanitized = { ...details };
            
            // Remove potentially sensitive fields
            delete sanitized.stack;
            delete sanitized.config;
            delete sanitized.request;
            delete sanitized.response;
            
            return sanitized;
        }

        return details;
    }

    /**
     * Log error with appropriate level and context
     * @param {Error} err - Error object
     * @param {Object} req - Express request object
     */
    static logError(err, req) {
        const logData = {
            error: {
                name: err.name,
                message: err.message,
                stack: err.stack,
                statusCode: err.statusCode || 500
            },
            request: {
                method: req.method,
                url: req.originalUrl,
                headers: ErrorHandler.sanitizeHeaders(req.headers),
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?._id || 'anonymous'
            },
            timestamp: new Date().toISOString()
        };

        // Log with appropriate level
        if (err.statusCode && err.statusCode < 500) {
            // Client errors (4xx) - log as warning
            console.warn('Client Error:', JSON.stringify(logData, null, 2));
        } else {
            // Server errors (5xx) or unknown errors - log as error
            console.error('Server Error:', JSON.stringify(logData, null, 2));
        }

        // In production, you might want to send errors to monitoring service
        if (process.env.NODE_ENV === 'production') {
            ErrorHandler.sendToMonitoringService(logData);
        }
    }

    /**
     * Sanitize request headers for logging
     * @param {Object} headers - Request headers
     * @returns {Object} - Sanitized headers
     */
    static sanitizeHeaders(headers) {
        const sanitized = { ...headers };
        
        // Remove sensitive headers
        delete sanitized.authorization;
        delete sanitized.cookie;
        delete sanitized['x-api-key'];
        delete sanitized['x-access-token'];
        
        return sanitized;
    }

    /**
     * Send error to monitoring service (placeholder)
     * @param {Object} logData - Error log data
     */
    static sendToMonitoringService(logData) {
        // This is a placeholder for integration with monitoring services
        // like Sentry, DataDog, New Relic, etc.
        
        // Example:
        // if (process.env.SENTRY_DSN) {
        //     Sentry.captureException(logData.error, {
        //         tags: {
        //             component: 'rbac-api',
        //             version: '2.0.0'
        //         },
        //         extra: logData
        //     });
        // }
        
        console.log('Monitoring service integration placeholder');
    }

    /**
     * Handle async errors (wrapper for async route handlers)
     * @param {Function} fn - Async function to wrap
     * @returns {Function} - Wrapped function
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Handle 404 errors
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Next middleware function
     */
    static handle404(req, res, next) {
        const error = new CustomError(
            `Route ${req.method} ${req.originalUrl} not found`,
            404
        );
        next(error);
    }

    /**
     * Create error for missing permissions
     * @param {Array} requiredPermissions - Required permissions
     * @param {Array} userPermissions - User's permissions
     * @returns {CustomError} - Permission error
     */
    static createPermissionError(requiredPermissions, userPermissions) {
        return new CustomError(
            'Insufficient permissions',
            403,
            {
                required: requiredPermissions,
                current: userPermissions
            }
        );
    }

    /**
     * Create error for authentication failure
     * @param {String} reason - Reason for authentication failure
     * @returns {CustomError} - Authentication error
     */
    static createAuthError(reason = 'Authentication failed') {
        return new CustomError(reason, 401);
    }

    /**
     * Create error for rate limiting
     * @param {String} type - Type of rate limiting
     * @returns {CustomError} - Rate limit error
     */
    static createRateLimitError(type = 'general') {
        const messages = {
            general: 'Too many requests, please try again later',
            auth: 'Too many authentication attempts, please try again later',
            api: 'API rate limit exceeded, please try again later'
        };

        return new CustomError(messages[type] || messages.general, 429);
    }

    /**
     * Create validation error
     * @param {Object} validationResults - Validation results
     * @returns {CustomError} - Validation error
     */
    static createValidationError(validationResults) {
        return new CustomError(
            'Validation failed',
            400,
            validationResults
        );
    }

    /**
     * Error categorization for analytics
     * @param {Error} err - Error object
     * @returns {String} - Error category
     */
    static categorizeError(err) {
        if (err.statusCode) {
            if (err.statusCode >= 400 && err.statusCode < 500) {
                return 'client_error';
            } else if (err.statusCode >= 500) {
                return 'server_error';
            }
        }

        if (err.name === 'ValidationError') return 'validation_error';
        if (err.name === 'CastError') return 'data_format_error';
        if (err.code === 11000) return 'duplicate_entry_error';
        if (err.name === 'JsonWebTokenError') return 'token_error';
        if (err.name === 'MongoNetworkError') return 'database_error';
        
        return 'unknown_error';
    }

    /**
     * Get error statistics
     * @param {Array} errors - Array of error objects
     * @returns {Object} - Error statistics
     */
    static getErrorStatistics(errors) {
        const stats = {
            total: errors.length,
            byCategory: {},
            byStatusCode: {},
            topErrors: {}
        };

        errors.forEach(err => {
            // Count by category
            const category = ErrorHandler.categorizeError(err);
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Count by status code
            const statusCode = err.statusCode || 500;
            stats.byStatusCode[statusCode] = (stats.byStatusCode[statusCode] || 0) + 1;

            // Count by error message
            const message = err.message || 'Unknown error';
            stats.topErrors[message] = (stats.topErrors[message] || 0) + 1;
        });

        return stats;
    }
}

module.exports = ErrorHandler;