// src/api/formApi.js

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get the token from localStorage
const getToken = () => {
    return localStorage.getItem('token');
};

export const saveFormData = async (formDetails) => {
    try {
        const token = getToken(); // Get the token
        const response = await fetch(`${API_BASE_URL}/save-form`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Include the token
            },
            body: JSON.stringify(formDetails),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save form');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving form:', error);
        throw error;
    }
};

export const updateFormData = async (formId, formDetails) => {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/update/${formId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, // Include the token
            },
            body: JSON.stringify(formDetails),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update form');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating form:', error);
        throw error;
    }
};

export const fetchForms = async () => {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/get-forms`, {
            headers: {
                'Authorization': `Bearer ${token}`, // Include the token
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch forms');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching forms:', error);
        throw error;
    }
};