// Validation functions for different validation types

const isRequired = (value) => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return 'This field is required.';
    }
    return null;
};

const isValidEmail = (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address.';
    }
    return null;
};

const isValidPhone = (value) => {
    if (value && !/^\d{10}$/.test(value)) { // Basic 10-digit phone number validation
        return 'Please enter a valid 10-digit phone number.';
    }
    return null;
};

const isNumeric = (value) => {
    if (value && !/^\d+$/.test(value)) {
        return 'Please enter only numbers.';
    }
    return null;
};

const isAlphabetic = (value) => {
    if (value && !/^[a-zA-Z]+$/.test(value)) {
        return 'Please enter only alphabets.';
    }
    return null;
};

const isAlphanumeric = (value) => {
    if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
        return 'Please enter only alphanumeric characters.';
    }
    return null;
};

const isValidURL = (value) => {
    if (value && !/^(ftp|http|https):\/\/[^ "]+$/.test(value)) {
        return 'Please enter a valid URL.';
    }
    return null;
};

const isStrongPassword = (value) => {
    if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)) {
        return 'Password must be at least 8 characters long and include uppercase, lowercase, number, and a special character.';
    }
    return null;
};

const isMinLength = (value, minLength) => {
    if (value && value.length < parseInt(minLength, 10)) {
        return `This field must be at least ${minLength} characters long.`;
    }
    return null;
};

const isMaxLength = (value, maxLength) => {
    if (value && value.length > parseInt(maxLength, 10)) {
        return `This field must be at most ${maxLength} characters long.`;
    }
    return null;
};

const mustMatch = (value, otherFieldValue, formData) => {
    if (value !== formData[otherFieldValue]) {
        return `This field must match ${otherFieldValue}.`;
    }
    return null;
};

const isDateFuture = (value) => {
    if (value && new Date(value) <= new Date()) {
        return 'Date must be in the future.';
    }
    return null;
};

const isDatePast = (value) => {
    if (value && new Date(value) >= new Date()) {
        return 'Date must be in the past.';
    }
    return null;
};

const hasNoSpaces = (value) => {
    if (value && /\s/.test(value)) {
        return 'Spaces are not allowed in this field.';
    }
    return null;
};

const isPositiveNumber = (value) => {
    if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
        return 'Please enter a positive number.';
    }
    return null;
};

const isWholeNumber = (value) => {
    if (value && (isNaN(Number(value)) || !Number.isInteger(Number(value)))) {
        return 'Please enter a whole number.';
    }
    return null;
};

const isExactLength = (value, exactLength) => {
    if (value && value.length !== parseInt(exactLength, 10)) {
        return `This field must be exactly ${exactLength} characters long.`;
    }
    return null;
};

export const validateField = (field, value, formData) => {
    const errors = [];

    if (field.validations && field.validations.length > 0) {
        field.validations.forEach(validationType => {
            switch (validationType) {
                case 'required':
                    const requiredError = isRequired(value);
                    if (requiredError) errors.push(requiredError);
                    break;
                case 'email':
                    const emailError = isValidEmail(value);
                    if (emailError) errors.push(emailError);
                    break;
                case 'phone':
                    const phoneError = isValidPhone(value);
                    if (phoneError) errors.push(phoneError);
                    break;
                case 'numeric':
                    const numericError = isNumeric(value);
                    if (numericError) errors.push(numericError);
                    break;
                case 'alphabetic':
                    const alphaError = isAlphabetic(value);
                    if (alphaError) errors.push(alphaError);
                    break;
                case 'alphanumeric':
                    const alphanumericError = isAlphanumeric(value);
                    if (alphanumericError) errors.push(alphanumericError);
                    break;
                case 'url':
                    const urlError = isValidURL(value);
                    if (urlError) errors.push(urlError);
                    break;
                case 'password-strong':
                    const strongPasswordError = isStrongPassword(value);
                    if (strongPasswordError) errors.push(strongPasswordError);
                    break;
                case 'min-length':
                    const minLengthError = isMinLength(value, field.minLength);
                    if (minLengthError) errors.push(minLengthError);
                    break;
                case 'max-length':
                    const maxLengthError = isMaxLength(value, field.maxLength);
                    if (maxLengthError) errors.push(maxLengthError);
                    break;
                case 'match':
                    const matchError = mustMatch(value, field.matchField, formData);
                    if (matchError) errors.push(matchError);
                    break;
                case 'date-future':
                    const dateFutureError = isDateFuture(value);
                    if (dateFutureError) errors.push(dateFutureError);
                    break;
                case 'date-past':
                    const datePastError = isDatePast(value);
                    if (datePastError) errors.push(datePastError);
                    break;
                case 'no-spaces':
                    const noSpacesError = hasNoSpaces(value);
                    if (noSpacesError) errors.push(noSpacesError);
                    break;
                case 'positive-number':
                    const positiveNumberError = isPositiveNumber(value);
                    if (positiveNumberError) errors.push(positiveNumberError);
                    break;
                case 'whole-number':
                    const wholeNumberError = isWholeNumber(value);
                    if (wholeNumberError) errors.push(wholeNumberError);
                    break;
                case 'exact-length':
                    const exactLengthError = isExactLength(value, field.exactLength);
                    if (exactLengthError) errors.push(exactLengthError);
                    break;
                default:
                    break;
            }
        });
    }

    return errors.length > 0 ? errors : null;
};