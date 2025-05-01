// frontend-react/src/utils/validationOptions.js

export const validationOptions = [
    { value: '', label: 'None' },
    { value: 'required', label: 'Required' },
    { value: 'email', label: 'Valid Email' },
    { value: 'phone', label: 'Valid Phone Number' },
    { value: 'numeric', label: 'Numbers Only' },
    { value: 'alphabetic', label: 'Alphabets Only' },
    { value: 'alphanumeric', label: 'Alphanumeric Only' },
    { value: 'url', label: 'Valid URL' },
    { value: 'password-strong', label: 'Strong Password' },
    { value: 'min-length', label: 'Minimum Length' },
    { value: 'max-length', label: 'Maximum Length' },
    { value: 'match', label: 'Must Match Another Field' },
    { value: 'date-future', label: 'Date Should Be in Future' },
    { value: 'date-past', label: 'Date Should Be in Past' },
    { value: 'no-spaces', label: 'No Spaces Allowed' },
    { value: 'positive-number', label: 'Positive Numbers Only' },
    { value: 'whole-number', label: 'Whole Numbers Only' },
    { value: 'exact-length', label: 'Exact Character Length' },
];