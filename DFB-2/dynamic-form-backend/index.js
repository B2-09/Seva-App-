const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const formController = require('./formController');
const authController = require('./authController')
const jwt = require('jsonwebtoken');
const path = require('path'); // <--- NEW IMPORT for path
const { initializeDatabasePool } = require('./database');

const app = express();
const PORT = 5000;

app.use(cors());
// IMPORTANT: Increase bodyParser limit for file uploads (Base64 can be large)
app.use(bodyParser.json({ limit: '50mb' })); // <--- UPDATED: Increased limit
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // If you also use urlencoded

// <--- NEW: Serve static files from the 'uploads' directory ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Secret key (should be in an environment variable)
const secretKey = 'PPAPPPAPPineApplePenAPPLEpen';
// --- Helper Function ---
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, "your_super_secret_jwt_key", (err, decoded) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            // Handle specific errors for better debugging if needed (e.g., TokenExpiredError)
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ message: 'Token expired. Please log in again.' });
            }
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// --- Authentication Routes ---
app.post('/api/register', formController.registerUser);
app.post('/api/login', formController.loginUser);
app.get('/api/user', verifyToken, formController.getUserData);

// --- Form Definition Routes ---
app.post('/api/save-form', verifyToken, formController.saveFormData);
app.get('/api/get-forms', formController.getAllFormsData);
app.put('/api/update/:formId', verifyToken, formController.updateFormData);
app.get('/api/get-form/:formId', formController.getFormDataById);

// --- Route for Form Submissions ---
app.post('/api/submit-form/:formId', formController.submitFormSubmission);
app.post('/api/submit-profile-data', verifyToken, formController.submitProfileData); // Map to the new function
app.get('/api/profile', verifyToken, formController.getProfileData); // Map to the new function


// Route for OTP Submissions
app.post('/api/send-otp', authController.sendOtp);
app.post('/api/verify-otp', authController.verifyOtp);

async function startApplication() {
    await initializeDatabasePool(); // Initialize the pool before starting server
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startApplication();