/**
 * Validation Utilities - Comprehensive input validation for RBAC system
 * 
 * Features:
 * - Input sanitization
 * - Data validation
 * - Security checks
 * - Performance optimization
 * 
 * @author Expert Backend Developer
 * @version 2.0.0
 */

const validator = require('validator');

class Validators {
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {object} - Validation result
     */
    static validateEmail(email) {
        if (!email) {
            return { isValid: false, message: 'Email is required' };
        }

        if (typeof email !== 'string') {
            return { isValid: false, message: 'Email must be a string' };
        }

        const trimmedEmail = email.trim().toLowerCase();

        if (!validator.isEmail(trimmedEmail)) {
            return { isValid: false, message: 'Invalid email format' };
        }

        if (trimmedEmail.length > 254) {
            return { isValid: false, message: 'Email is too long' };
        }

        return { isValid: true, sanitized: trimmedEmail };
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} - Validation result
     */
    static validatePassword(password) {
        const result = {
            isValid: false,
            score: 0,
            feedback: [],
            requirements: {
                minLength: false,
                hasUpperCase: false,
                hasLowerCase: false,
                hasNumbers: false,
                hasSpecialChars: false,
                noCommonPatterns: false
            }
        };

        if (!password) {
            result.feedback.push('Password is required');
            return result;
        }

        if (typeof password !== 'string') {
            result.feedback.push('Password must be a string');
            return result;
        }

        // Check minimum length
        if (password.length >= 8) {
            result.requirements.minLength = true;
            result.score += 1;
        } else {
            result.feedback.push('Password must be at least 8 characters long');
        }

        // Check for uppercase letters
        if (/[A-Z]/.test(password)) {
            result.requirements.hasUpperCase = true;
            result.score += 1;
        } else {
            result.feedback.push('Password should contain at least one uppercase letter');
        }

        // Check for lowercase letters
        if (/[a-z]/.test(password)) {
            result.requirements.hasLowerCase = true;
            result.score += 1;
        } else {
            result.feedback.push('Password should contain at least one lowercase letter');
        }

        // Check for numbers
        if (/\d/.test(password)) {
            result.requirements.hasNumbers = true;
            result.score += 1;
        } else {
            result.feedback.push('Password should contain at least one number');
        }

        // Check for special characters
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            result.requirements.hasSpecialChars = true;
            result.score += 1;
        } else {
            result.feedback.push('Password should contain at least one special character');
        }

        // Check for common patterns
        const commonPatterns = [
            /123456/,
            /password/i,
            /qwerty/i,
            /abc123/i,
            /admin/i,
            /letmein/i
        ];

        const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
        if (!hasCommonPattern) {
            result.requirements.noCommonPatterns = true;
            result.score += 1;
        } else {
            result.feedback.push('Password contains common patterns and is too predictable');
        }

        // Determine if password is valid (minimum requirements)
        result.isValid = result.requirements.minLength && 
                        result.requirements.hasLowerCase && 
                        (result.requirements.hasUpperCase || result.requirements.hasNumbers);

        return result;
    }

    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @returns {object} - Validation result
     */
    static validatePhone(phone) {
        if (!phone) {
            return { isValid: true, sanitized: null }; // Phone is optional
        }

        if (typeof phone !== 'string') {
            return { isValid: false, message: 'Phone number must be a string' };
        }

        const trimmedPhone = phone.trim();

        // Basic phone number validation
        const phoneRegex = /^\+?[\d\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(trimmedPhone)) {
            return { isValid: false, message: 'Invalid phone number format' };
        }

        // Remove formatting and check if it contains enough digits
        const digitsOnly = trimmedPhone.replace(/\D/g, '');
        if (digitsOnly.length < 7 || digitsOnly.length > 15) {
            return { isValid: false, message: 'Phone number must contain 7-15 digits' };
        }

        return { isValid: true, sanitized: trimmedPhone };
    }

    /**
     * Validate name (first name, last name)
     * @param {string} name - Name to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {object} - Validation result
     */
    static validateName(name, fieldName = 'Name') {
        if (!name) {
            return { isValid: false, message: `${fieldName} is required` };
        }

        if (typeof name !== 'string') {
            return { isValid: false, message: `${fieldName} must be a string` };
        }

        const trimmedName = name.trim();

        if (trimmedName.length < 1) {
            return { isValid: false, message: `${fieldName} cannot be empty` };
        }

        if (trimmedName.length > 50) {
            return { isValid: false, message: `${fieldName} cannot exceed 50 characters` };
        }

        // Check for valid name characters (letters, spaces, hyphens, apostrophes)
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(trimmedName)) {
            return { isValid: false, message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
        }

        return { isValid: true, sanitized: trimmedName };
    }

    /**
     * Validate employee ID
     * @param {string} employeeId - Employee ID to validate
     * @returns {object} - Validation result
     */
    static validateEmployeeId(employeeId) {
        if (!employeeId) {
            return { isValid: false, message: 'Employee ID is required' };
        }

        if (typeof employeeId !== 'string') {
            return { isValid: false, message: 'Employee ID must be a string' };
        }

        const trimmedId = employeeId.trim();

        if (trimmedId.length < 3) {
            return { isValid: false, message: 'Employee ID must be at least 3 characters long' };
        }

        if (trimmedId.length > 20) {
            return { isValid: false, message: 'Employee ID cannot exceed 20 characters' };
        }

        // Employee ID should contain only alphanumeric characters, hyphens, and underscores
        const idRegex = /^[a-zA-Z0-9\-_]+$/;
        if (!idRegex.test(trimmedId)) {
            return { isValid: false, message: 'Employee ID can only contain letters, numbers, hyphens, and underscores' };
        }

        return { isValid: true, sanitized: trimmedId.toUpperCase() };
    }

    /**
     * Validate department
     * @param {string} department - Department to validate
     * @returns {object} - Validation result
     */
    static validateDepartment(department) {
        const validDepartments = [
            'IT', 
            'Marketing', 
            'Sales', 
            'Customer Support', 
            'Content', 
            'Finance', 
            'HR', 
            'Operations'
        ];

        if (!department) {
            return { isValid: false, message: 'Department is required' };
        }

        if (typeof department !== 'string') {
            return { isValid: false, message: 'Department must be a string' };
        }

        const trimmedDepartment = department.trim();

        if (!validDepartments.includes(trimmedDepartment)) {
            return { 
                isValid: false, 
                message: `Invalid department. Must be one of: ${validDepartments.join(', ')}` 
            };
        }

        return { isValid: true, sanitized: trimmedDepartment };
    }

    /**
     * Validate position/job title
     * @param {string} position - Position to validate
     * @returns {object} - Validation result
     */
    static validatePosition(position) {
        if (!position) {
            return { isValid: false, message: 'Position is required' };
        }

        if (typeof position !== 'string') {
            return { isValid: false, message: 'Position must be a string' };
        }

        const trimmedPosition = position.trim();

        if (trimmedPosition.length < 2) {
            return { isValid: false, message: 'Position must be at least 2 characters long' };
        }

        if (trimmedPosition.length > 100) {
            return { isValid: false, message: 'Position cannot exceed 100 characters' };
        }

        // Position can contain letters, numbers, spaces, and common punctuation
        const positionRegex = /^[a-zA-Z0-9\s\-_.,&()]+$/;
        if (!positionRegex.test(trimmedPosition)) {
            return { isValid: false, message: 'Position contains invalid characters' };
        }

        return { isValid: true, sanitized: trimmedPosition };
    }

    /**
     * Validate permission name
     * @param {string} permissionName - Permission name to validate
     * @returns {object} - Validation result
     */
    static validatePermissionName(permissionName) {
        if (!permissionName) {
            return { isValid: false, message: 'Permission name is required' };
        }

        if (typeof permissionName !== 'string') {
            return { isValid: false, message: 'Permission name must be a string' };
        }

        const trimmedName = permissionName.trim().toLowerCase();

        // Permission format: action:resource (e.g., "create:tours")
        const permissionRegex = /^[a-z_]+:[a-z_]+$/;
        if (!permissionRegex.test(trimmedName)) {
            return { 
                isValid: false, 
                message: 'Permission name must follow format "action:resource" (e.g., "create:tours")' 
            };
        }

        const [action, resource] = trimmedName.split(':');

        // Validate action
        const validActions = [
            'create', 'read', 'update', 'delete', 
            'list', 'view', 'edit', 'remove',
            'block', 'unblock', 'approve', 'reject',
            'export', 'import', 'manage'
        ];

        if (!validActions.includes(action)) {
            return { 
                isValid: false, 
                message: `Invalid action "${action}". Must be one of: ${validActions.join(', ')}` 
            };
        }

        // Validate resource length
        if (resource.length < 2 || resource.length > 20) {
            return { isValid: false, message: 'Resource name must be 2-20 characters long' };
        }

        return { isValid: true, sanitized: trimmedName };
    }

    /**
     * Validate role name
     * @param {string} roleName - Role name to validate
     * @returns {object} - Validation result
     */
    static validateRoleName(roleName) {
        if (!roleName) {
            return { isValid: false, message: 'Role name is required' };
        }

        if (typeof roleName !== 'string') {
            return { isValid: false, message: 'Role name must be a string' };
        }

        const trimmedName = roleName.trim();

        if (trimmedName.length < 2) {
            return { isValid: false, message: 'Role name must be at least 2 characters long' };
        }

        if (trimmedName.length > 50) {
            return { isValid: false, message: 'Role name cannot exceed 50 characters' };
        }

        // Role name can contain letters, numbers, spaces, and hyphens
        const roleRegex = /^[a-zA-Z0-9\s\-]+$/;
        if (!roleRegex.test(trimmedName)) {
            return { isValid: false, message: 'Role name can only contain letters, numbers, spaces, and hyphens' };
        }

        return { isValid: true, sanitized: trimmedName };
    }

    /**
     * Validate MongoDB ObjectId
     * @param {string} id - ID to validate
     * @param {string} fieldName - Field name for error messages
     * @returns {object} - Validation result
     */
    static validateObjectId(id, fieldName = 'ID') {
        if (!id) {
            return { isValid: false, message: `${fieldName} is required` };
        }

        if (typeof id !== 'string') {
            return { isValid: false, message: `${fieldName} must be a string` };
        }

        const trimmedId = id.trim();

        if (!validator.isMongoId(trimmedId)) {
            return { isValid: false, message: `Invalid ${fieldName} format` };
        }

        return { isValid: true, sanitized: trimmedId };
    }

    /**
     * Validate pagination parameters
     * @param {object} params - Pagination parameters
     * @returns {object} - Validation result
     */
    static validatePaginationParams(params) {
        const result = {
            isValid: true,
            errors: [],
            sanitized: {}
        };

        // Validate page
        let page = parseInt(params.page) || 1;
        if (page < 1) {
            page = 1;
        }
        if (page > 10000) {
            result.errors.push('Page number too large');
            result.isValid = false;
        }
        result.sanitized.page = page;

        // Validate limit
        let limit = parseInt(params.limit) || 20;
        if (limit < 1) {
            limit = 1;
        }
        if (limit > 100) {
            limit = 100;
        }
        result.sanitized.limit = limit;

        // Validate sort order
        const sortOrder = params.sortOrder?.toLowerCase();
        if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
            result.errors.push('Sort order must be "asc" or "desc"');
            result.isValid = false;
        }
        result.sanitized.sortOrder = sortOrder || 'asc';

        return result;
    }

    /**
     * Sanitize search query
     * @param {string} searchQuery - Search query to sanitize
     * @returns {object} - Sanitization result
     */
    static sanitizeSearchQuery(searchQuery) {
        if (!searchQuery) {
            return { sanitized: '' };
        }

        if (typeof searchQuery !== 'string') {
            return { sanitized: '' };
        }

        // Remove potentially harmful characters and limit length
        let sanitized = searchQuery
            .trim()
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/[{}]/g, '') // Remove curly braces
            .substring(0, 100); // Limit to 100 characters

        return { sanitized };
    }

    /**
     * Validate staff creation data
     * @param {object} staffData - Staff data to validate
     * @returns {object} - Validation result
     */
    static validateStaffData(staffData) {
        const result = {
            isValid: true,
            errors: [],
            sanitized: {}
        };

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'department', 'position'];
        
        for (const field of requiredFields) {
            if (!staffData[field]) {
                result.errors.push(`${field} is required`);
                result.isValid = false;
            }
        }

        // Validate individual fields
        const validations = [
            { field: 'firstName', validator: (value) => this.validateName(value, 'First name') },
            { field: 'lastName', validator: (value) => this.validateName(value, 'Last name') },
            { field: 'email', validator: (value) => this.validateEmail(value) },
            { field: 'phone', validator: (value) => this.validatePhone(value) },
            { field: 'department', validator: (value) => this.validateDepartment(value) },
            { field: 'position', validator: (value) => this.validatePosition(value) },
            { field: 'employeeId', validator: (value) => this.validateEmployeeId(value) }
        ];

        for (const { field, validator } of validations) {
            if (staffData[field] !== undefined) {
                const validation = validator(staffData[field]);
                if (!validation.isValid) {
                    result.errors.push(validation.message);
                    result.isValid = false;
                } else if (validation.sanitized !== undefined) {
                    result.sanitized[field] = validation.sanitized;
                }
            }
        }

        // Validate password if provided
        if (staffData.password) {
            const passwordValidation = this.validatePassword(staffData.password);
            if (!passwordValidation.isValid) {
                result.errors.push(...passwordValidation.feedback);
                result.isValid = false;
            }
        }

        return result;
    }
}

module.exports = Validators;