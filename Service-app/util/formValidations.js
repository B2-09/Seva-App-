// src/utils/formValidations.js

export const validateRequired = (value) => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
        return 'This field is required';
    }
    return null;
};

export const validateEmail = (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Invalid email format';
    }
    return null;
};

export const validateMinLength = (value, minLength) => {
    if (value && value.length < parseInt(minLength, 10)) {
        return `Must be at least ${minLength} characters`;
    }
    return null;
};

export const validateMaxLength = (value, maxLength) => {
    if (value && value.length > parseInt(maxLength, 10)) {
        return `Must be at most ${maxLength} characters`;
    }
    return null;
};

export const validateNumber = (value) => {
    if (value && isNaN(Number(value))) {
        return 'Must be a number';
    }
    return null;
};

export const validateAlphabetic = (value) => {
    if (value && !/^[a-zA-Z\s]*$/.test(value)) {
        return 'Must contain only alphabetic characters';
    }
    return null;
};

export const validateNumeric = (value) => {
    if (value && !/^[0-9]*$/.test(value)) {
        return 'Must contain only numeric characters';
    }
    return null;
};

export const validateAlphaNumeric = (value) => {
    if (value && !/^[a-zA-Z0-9\s]*$/.test(value)) {
        return 'Must contain only alphanumeric characters';
    }
    return null;
};

export const validateURL = (value) => {
    if (value && !/^(ftp|http|https):\/\/[^ "]+$/.test(value)) {
        return 'Invalid URL format';
    }
    return null;
};

export const validatePattern = (value, pattern) => {
    if (value && !new RegExp(pattern).test(value)) {
        return `Must match the pattern: ${pattern}`;
    }
    return null;
};

export const validateMin = (value, min) => {
    if (value && Number(value) < parseFloat(min)) {
        return `Must be at least ${min}`;
    }
    return null;
};

export const validateMax = (value, max) => {
    if (value && Number(value) > parseFloat(max)) {
        return `Must be at most ${max}`;
    }
    return null;
};

const formValidations = {
    required: validateRequired,
    email: validateEmail,
    'min-length': validateMinLength,
    'max-length': validateMaxLength,
    number: validateNumber,
    alphabetic: validateAlphabetic,
    numeric: validateNumeric,
    'alpha-numeric': validateAlphaNumeric,
    url: validateURL,
    pattern: validatePattern,
    min: validateMin,
    max: validateMax,
    // Add mappings for other validation rules here as you implement them
};

export default formValidations;