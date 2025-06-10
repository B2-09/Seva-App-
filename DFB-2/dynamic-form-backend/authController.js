// controllers/authController.js
const { getConnection } = require('./database');
const { generateOtp } = require('./utils/smsService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

/**
 * Handles sending (saving) OTP to the database for a given phone number.
 */
exports.sendOtp = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const { phoneNumber } = req.body;
        const cleanedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

        if (!/^\+\d{1,3}\d{10}$/.test(cleanedPhoneNumber)) {
            return res.status(400).json({ message: 'Invalid phone number format. Use +CountryCode and 10 digits (e.g., +919876543210).' });
        }

        const otp = generateOtp();
        const expiresAt = Date.now() + 30 * 1000;

        const query = `
            INSERT INTO otps (phone_number, otp, expires_at)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = VALUES(expires_at)
        `;
        await connection.execute(query, [cleanedPhoneNumber, otp, expiresAt]);

        console.log(`Generated and saved OTP for ${cleanedPhoneNumber}: ${otp}`);
        res.status(200).json({ message: 'OTP sent (saved to DB) successfully!' });

    } catch (error) {
        console.error('Error in sendOtp:', error);
        res.status(500).json({ message: 'An unexpected error occurred during OTP generation.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Handles verifying the provided OTP and performs login/signup using usersprofile table.
 */
exports.verifyOtp = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const { phoneNumber, otp } = req.body;
        const cleanedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

        if (!cleanedPhoneNumber || !otp) {
            return res.status(400).json({ message: 'Phone number and OTP are required.' });
        }

        // --- OTP Verification Logic ---
        const [otpRows] = await connection.execute('SELECT otp, expires_at FROM otps WHERE phone_number = ?', [cleanedPhoneNumber]);
        const storedOtpData = otpRows[0];

        if (!storedOtpData) {
            return res.status(401).json({ message: 'OTP not found for this number. Please resend OTP.' });
        }

        if (storedOtpData.otp !== otp) {
            return res.status(401).json({ message: 'Incorrect OTP.' });
        }

        if (Date.now() > storedOtpData.expires_at) {
            await connection.execute('DELETE FROM otps WHERE phone_number = ?', [cleanedPhoneNumber]);
            return res.status(401).json({ message: 'OTP expired. Please resend OTP.' });
        }

        // OTP is valid. Delete from database
        await connection.execute('DELETE FROM otps WHERE phone_number = ?', [cleanedPhoneNumber]);

        // --- User Login/Signup Logic (using usersprofile) ---
        let userId;
        let message;
        let userData; // To store user details for JWT

        // Check if user exists in the usersprofile table by primary_phone
        const [userProfileRows] = await connection.execute('SELECT id, phone_number FROM usersprofile WHERE phone_number = ?', [cleanedPhoneNumber]);
        const userProfile = userProfileRows[0];

        if (userProfile) {
            // User exists, log them in
            userId = userProfile.id;
            message = 'Login successful!';
            userData = userProfile; // Include all fetched profile data
        } else {
            // User does not exist, register them in usersprofile
            // Only primary_phone is set during initial signup via OTP
            const [insertResult] = await connection.execute('INSERT INTO usersprofile (phone_number) VALUES (?)', [cleanedPhoneNumber]);
            userId = insertResult.insertId;
            message = 'Signup successful! Welcome.';
            userData = { id: userId, phone_number: cleanedPhoneNumber, form_data: null }; // Initial user data
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: userId,
                phoneNumber: cleanedPhoneNumber,
                // You can include other common profile data here if needed,
                // e.g., role_id: userData.role_id
            },
            JWT_SECRET,
            { expiresIn: '7d' } // Token valid for 1 hour
        );

        res.status(200).json({
            message,
            user: userData, // Send back the user's profile data
            token,
        });

    } catch (error) {
        console.error('Unexpected error during OTP verification:', error);
        res.status(500).json({ message: 'An unexpected error occurred.' });
    } finally {
        if (connection) connection.release();
    }
};