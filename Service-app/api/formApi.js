//  src/api/formApi.js

import { API_BASE_URL } from "../config";

// get specific form using id
export const getFormById = async (formId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/get-form/${formId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Faile`d to fetch form data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching form data:', error);
        throw error;
    }
};

// getting all the forms 
export const getAllForms = async () => {
    try {
        console.log(`${API_BASE_URL}/get-forms`)
        const response = await fetch(`${API_BASE_URL}/get-forms`);
        console.log(response)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch forms');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching form data:', error);
        throw error;
    }
};
// Submission for generic form data 
export const submitFormData = async (formId, formData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/submit-form/${formId}`, { // Assuming you might need the formId for submission
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit form');
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting form:', error);
        throw error;
    }
};

// Submission for profile data 
export const submitProfileData = async (formData, userToken) => {
    try {
        // No need to explicitly pass phoneNumber as it's in the JWT
        const response = await fetch(`${API_BASE_URL}/submit-profile-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`, // IMPORTANT: Send the JWT token
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit profile data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting profile data:', error);
        throw error;
    }
};

// Not in use right now
export const sendOtp = async (phoneNumber) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/send-otp`, { phoneNumber });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit profile data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error in sendOtp API call:', error);
        throw error.response?.data?.message || error.message || 'Failed to send OTP';
    }
};

// Not in use right now
export const verifyOtp = async (phoneNumber, otp) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/verify-otp`, { phoneNumber, otp });
        return response.data;
    } catch (error) {
        console.error('Error in verifyOtp API call:', error);
        throw error.response?.data?.message || error.message || 'Failed to verify OTP';
    }
};