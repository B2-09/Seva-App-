const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // For password hashing
const fs = require('fs').promises; // <--- NEW IMPORT for file system operations
const path = require('path');

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'dynamic_screen_db'
};

// Secret key for JWT (keep this secure)
const secretKey = 'PPAPPPAPPineApplePenAPPLEpen';  // CHANGE THIS TO A SECURE VALUE

// --- Helper Functions ---

// Function to establish a database connection
const getConnection = async () => {
    return await mysql.createConnection(dbConfig);
};

const UPLOADS_DIR = path.join(__dirname, 'uploads'); // <--- NEW: Define uploads directory

// Ensure the uploads directory exists
const ensureUploadsDirExists = async () => { // <--- NEW: Function to create directory
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        console.log(`Uploads directory created or already exists at: ${UPLOADS_DIR}`);
    } catch (error) {
        console.error('Error ensuring uploads directory exists:', error);
        // You might want to throw or handle this error more robustly
    }
};

// Call this once when your server starts up
ensureUploadsDirExists();

// --- Controller Functions ---

// Asynchronous function to handle user registration (signup)
const registerUser = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Basic validation
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const connection = await getConnection();

        // Check if the user already exists
        const [existingUsers] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            await connection.end();
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Insert the new user into the database
        await connection.execute('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, name]);

        // Get the newly inserted user's ID
        const [insertedUser] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        const userId = insertedUser[0].id;

        await connection.end();

        // Generate a JWT token upon successful registration
        const token = jwt.sign({ sub: userId, name, email }, secretKey, { expiresIn: '1h' });
        res.status(201).json({ message: 'User registered successfully', token });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Asynchronous function to handle user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const connection = await getConnection();

        // Retrieve the user from the database by email
        const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        await connection.end();

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Compare the provided password with the hashed password from the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate a JWT token upon successful login
        const token = jwt.sign({ sub: user.id, name: user.name, email: user.email }, secretKey, { expiresIn: '1h' });
        res.json({ token });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
};

// Asynchronous function to save form data (form definition) to the database.
const saveFormData = async (req, res) => {
    try {
        const { formName, formDescription, fields } = req.body;
        const formData = { formName, formDescription, fields };

        if (!formName) {
            return res.status(400).json({ error: 'Form name is required in the request.' });
        }

        const connection = await getConnection();

        const [formResult] = await connection.execute(
            'INSERT INTO forms (form_data) VALUES (?)',
            [JSON.stringify(formData)]
        );
        const formId = formResult.insertId;

        await connection.end();

        res.status(201).json({ message: 'Form data saved as JSON successfully!', formId: formId });

    } catch (error) {
        console.error('Error saving form data as JSON:', error);
        res.status(500).json({ error: 'Failed to save form data as JSON.' });
    }
};

// Asynchronous function to retrieve all form data (form definitions) from the database.
const getAllFormsData = async (req, res) => {
    try {
        const connection = await getConnection();

        const [forms] = await connection.execute('SELECT id, is_active, form_data FROM forms');

        await connection.end();

        res.status(200).json(forms);

    } catch (error) {
        console.error('Error fetching all form data (as JSON):', error);
        res.status(500).json({ error: 'Failed to fetch form data (as JSON).' });
    }
};

// Asynchronous function to update existing form data (form definition) in the database.
const updateFormData = async (req, res) => {
    const { formId } = req.params;
    const { form_data } = req.body;

    let formDescription, fields, formName;
    if (form_data) {
        formDescription = form_data.formDescription;
        fields = form_data.fields;
        formName = form_data.formName;
    } else {
        formDescription = undefined;
        fields = undefined;
        formName = undefined;
    }

    const updatedFormData = { formDescription, fields, formName };

    try {
        const connection = await getConnection();
        const [result] = await connection.execute(
            'UPDATE forms SET form_data = ? WHERE id = ?',
            [JSON.stringify(updatedFormData), formId]
        );
        await connection.end();

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Form updated successfully!' });
        } else {
            res.status(404).json({ error: 'Form not found.' });
        }
    } catch (error) {
        console.error('Error updating form data:', error);
        res.status(500).json({ error: 'Failed to update form data.' });
    }
};

// Asynchronous function to retrieve form data (form definition) by its ID from the database.
const getFormDataById = async (req, res) => {
    const { formId } = req.params;

    try {
        const connection = await getConnection();
        const [form] = await connection.execute('SELECT form_data FROM forms WHERE id = ?', [formId]);
        await connection.end();

        if (form.length > 0) {
            res.status(200).json(form[0]);
        } else {
            res.status(404).json({ error: 'Form not found.' });
        }
    } catch (error) {
        console.error('Error fetching form data by ID:', error);
        res.status(500).json({ error: 'Failed to fetch form data.' });
    }
};

// Asynchronous function to get user data
const getUserData = async (req, res) => {
    try {
        const userId = req.auth.sub; // Get user ID from the JWT

        const connection = await getConnection();
        const [users] = await connection.execute('SELECT id, name, email FROM users WHERE id = ?', [userId]);
        await connection.end();

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        res.status(200).json({ id: user.id, name: user.name, email: user.email });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

const submitFormSubmission = async (req, res) => {
    try {
        const { formId } = req.params;
        const formData = req.body;

        if (!formId) {
            return res.status(400).json({ error: 'Form ID is required for submission.' });
        }
        if (typeof formData !== 'object' || formData === null) {
            return res.status(400).json({ error: 'Invalid form data format. Expected a JSON object.' });
        }

        const filesToSave = []; // Array to store details of files to save

        // <--- NEW LOGIC: Iterate through formData to find and process files ---
        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                const fieldData = formData[key];

                // Check if the field looks like a file/image object (has base64, name, mimeType)
                if (typeof fieldData === 'object' && fieldData !== null &&
                    fieldData.base64 && fieldData.name && fieldData.mimeType) {

                    const base64Content = fieldData.base64;
                    const fileName = fieldData.name;
                    const mimeType = fieldData.mimeType;

                    // Generate a unique file name to prevent conflicts
                    const uniqueFileName = `${Date.now()}_${fileName}`;
                    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

                    try {
                        // Decode Base64 and write the file
                        const fileBuffer = Buffer.from(base64Content, 'base64');
                        await fs.writeFile(filePath, fileBuffer);

                        // Store the server-side file path and URL (if applicable)
                        // This URL is what you'd save in the database to retrieve the file later
                        const fileUrl = `/uploads/${uniqueFileName}`; // Adjust based on how you serve static files

                        // Update the formData with the server-side file path/URL
                        // Instead of the raw base64, save the path
                        formData[key] = {
                            name: fileName,
                            mimeType: mimeType,
                            url: fileUrl // This is the URL to access the saved file
                        };

                        console.log(`File saved: ${filePath}`);

                    } catch (fileError) {
                        console.error(`Error saving file ${fileName}:`, fileError);
                        // Decide how to handle file saving errors (e.g., skip this file, return error)
                        // For now, we'll log and continue, but the formData for this field will be incomplete
                        formData[key] = {
                            name: fileName,
                            mimeType: mimeType,
                            error: 'Failed to save file on server'
                        };
                    }
                }
            }
        }
        // <--- END NEW LOGIC ---

        const connection = await getConnection();

        const [result] = await connection.execute(
            'INSERT INTO form_submissions (form_id, submitted_data) VALUES (?, ?)',
            [formId, JSON.stringify(formData)] // formData now contains file URLs/metadata
        );

        const submissionId = result.insertId || 'N/A (UUID handled by DB)';

        await connection.end();

        res.status(201).json({ message: 'Form submission saved successfully!', submissionId: submissionId });

    } catch (error) {
        console.error('Error saving form submission:', error);
        res.status(500).json({ error: 'Failed to save form submission.' });
    }
};

const submitProfileData = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        const formData = req.body; // This is the entire form data from the frontend
        // const userId = req.user.userId; // Previous way of getting ID
        const phoneNumberFromToken = req.user.phoneNumber; // Get phone number from the authenticated token
        console.log(phoneNumberFromToken)

        if (!phoneNumberFromToken) {
            // This case should ideally not happen if JWT middleware is correctly set up
            return res.status(401).json({ message: 'Phone number not found in authentication token.' });
        }

        // Handle image data if present in formData from the 'Profile photo' field
        if (formData['Profile photo'] && formData['Profile photo'].base64) {
            const imageData = formData['Profile photo'];
            const base64Data = imageData.base64;
            const mimeType = imageData.mimeType;
            const fileName = `${Date.now()}_${imageData.name}`;
            const uploadDir = path.join(__dirname, '../uploads');
            const filePath = path.join(uploadDir, fileName);

            await fs.mkdir(uploadDir, { recursive: true });
            const base64Image = base64Data.split(';base64,').pop();
            await fs.writeFile(filePath, base64Image, { encoding: 'base64' });

            // Store the relative URL in formData before saving to JSON column
            formData['Profile photo'] = {
                url: `/uploads/${fileName}`, // This URL will be saved in the JSON
                name: imageData.name,
                mimeType: mimeType,
            };
            console.log(`Profile image saved to: ${filePath}, URL: ${formData['Profile photo'].url}`);
        }

        // Convert the entire formData object to a JSON string
        const formDataJsonString = JSON.stringify(formData);

        // Update the usersprofile table's form_data column based on phone_number
        const updateQuery = `
            UPDATE usersprofile
            SET form_data = ?
            WHERE phone_number = ?; 
        `;
        // -- <--- CRUCIAL CHANGE: Using phone_number in WHERE clause
        const [result] = await connection.execute(updateQuery, [formDataJsonString, phoneNumberFromToken]); // Pass phone number

        if (result.affectedRows === 0) {
            // This might happen if the phone_number in the token doesn't match an existing row
            // or if no data was actually changed.
            return res.status(404).json({ message: 'User profile not found for this phone number or no data changed.' });
        }

        res.status(200).json({
            message: 'Profile data updated successfully!',
            submittedData: formData // Return the processed formData (with image URL)
        });

    } catch (error) {
        console.error('Error submitting profile data:', error);
        res.status(500).json({ message: 'Failed to update profile data.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

const getProfileData = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const phoneNumberFromToken = req.user.phoneNumber; // Get phone number from authenticated token

        if (!phoneNumberFromToken) {
            return res.status(401).json({ message: 'Phone number not found in authentication token.' });
        }

        const [rows] = await connection.execute(
            'SELECT id, phone_number, form_data FROM usersprofile WHERE phone_number = ?',
            [phoneNumberFromToken]
        );

        const userProfile = rows[0];

        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        // The 'form_data' column (JSON type in MySQL) should come back as a JS object directly.
        // Add a check for string conversion for robustness, though usually not needed for JSON type.
        let formData = userProfile.form_data;
        if (typeof formData === 'string') {
            try {
                formData = JSON.parse(formData);
                console.log(formData)
            } catch (parseError) {
                console.error('Error parsing form_data from DB (it was a string):', parseError);
                formData = {}; // Default to empty object on parse failure
            }
        } else if (!formData) {
            formData = {}; // Default to empty object if null/undefined
        }

        const combinedProfileData = {
            id: userProfile.id,
            phoneNumber: userProfile.phone_number,
            formData: formData // This now contains all the form fields including 'profile_id' if generated
        };

        res.status(200).json({ profile: combinedProfileData });

    } catch (error) {
        console.error('Error fetching profile data:', error);
        res.status(500).json({ message: 'Failed to fetch profile data.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};


// Exports the controller functions
module.exports = {
    registerUser,
    loginUser,
    saveFormData,
    getAllFormsData,
    updateFormData,
    getFormDataById,
    getUserData,
    submitFormSubmission, // Export the new function
    submitProfileData,
    getProfileData,
};