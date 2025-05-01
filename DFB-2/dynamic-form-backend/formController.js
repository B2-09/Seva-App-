const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // For password hashing

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

// Asynchronous function to save form data to the database.
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

// Asynchronous function to retrieve all form data from the database.
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

// Asynchronous function to update existing form data in the database.
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

// Asynchronous function to retrieve form data by its ID from the database.
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

// Exports the controller functions
module.exports = {
    registerUser,
    loginUser,
    saveFormData,
    getAllFormsData,
    updateFormData,
    getFormDataById,
    getUserData,
};

// const mysql = require('mysql2/promise'); // Imports the asynchronous MySQL library.

// // Database connection configuration object.
// const dbConfig = {
//     host: 'localhost', // Replace with your database host - the address of your MySQL server.
//     user: 'root', // Replace with your database user - the username for connecting to the database.
//     password: 'root', // Replace with your database password - the password for the specified user.
//     database: 'dynamic_screen_db' // Replace with your database name - the name of the database to use.
// };

// // Asynchronous function to save form data to the database.
// const saveFormData = async (req, res) => {
//     try {
//         // Extracts formName, formDescription, and fields from the request body.
//         const { formName, formDescription, fields } = req.body;
//         // Creates a complete JSON object containing all form details.
//         const formData = { formName, formDescription, fields };

//         // Basic validation to ensure formName is present in the request.
//         if (!formName) {
//             // If formName is missing, return a 400 (Bad Request) error with a message.
//             return res.status(400).json({ error: 'Form name is required in the request.' });
//         }

//         // Establishes a new asynchronous connection to the MySQL database using the dbConfig.
//         const connection = await mysql.createConnection(dbConfig);

//         // Executes an SQL INSERT query to save the entire formData as a JSON string in the 'forms' table.
//         const [formResult] = await connection.execute(
//             'INSERT INTO forms (form_data) VALUES (?)',
//             [JSON.stringify(formData)] // Converts the JavaScript object into a JSON string before saving.
//         );
//         // Retrieves the ID of the newly inserted form record.
//         const formId = formResult.insertId;

//         // Closes the database connection.
//         await connection.end();

//         // Returns a 201 (Created) success response with a message and the newly generated form ID.
//         res.status(201).json({ message: 'Form data saved as JSON successfully!', formId: formId });

//     } catch (error) {
//         // Catches any errors that occur during the process.
//         console.error('Error saving form data as JSON:', error);
//         // Returns a 500 (Internal Server Error) response with an error message.
//         res.status(500).json({ error: 'Failed to save form data as JSON.' });
//     }
// };

// // Asynchronous function to retrieve all form data from the database.
// const getAllFormsData = async (req, res) => {
//     try {
//         // Establishes a new asynchronous connection to the MySQL database.
//         const connection = await mysql.createConnection(dbConfig);

//         // Executes an SQL SELECT query to retrieve the id, is_active status, and form_data from the 'forms' table.
//         const [forms] = await connection.execute('SELECT id, is_active, form_data FROM forms');

//         // Closes the database connection.
//         await connection.end();

//         // Returns a 200 (OK) success response with an array of all form records.
//         res.status(200).json(forms);

//     } catch (error) {
//         // Catches any errors during the process.
//         console.error('Error fetching all form data (as JSON):', error);
//         // Returns a 500 (Internal Server Error) response with an error message.
//         res.status(500).json({ error: 'Failed to fetch form data (as JSON).' });
//     }
// };

// // Asynchronous function to update existing form data in the database.
// const updateFormData = async (req, res) => {
//     const { formId } = req.params;
//     const { form_data } = req.body;

//     let formDescription, fields, formName; // Add formName here
//     if (form_data) {
//         formDescription = form_data.formDescription;
//         fields = form_data.fields;
//         formName = form_data.formName; // Extract formName
//     } else {
//         formDescription = undefined;
//         fields = undefined;
//         formName = undefined;
//     }

//     const updatedFormData = { formDescription, fields, formName }; // Include formName in updatedFormData

//     try {
//         const connection = await mysql.createConnection(dbConfig);
//         const [result] = await connection.execute(
//             'UPDATE forms SET form_data = ? WHERE id = ?',
//             [JSON.stringify(updatedFormData), formId]
//         );
//         await connection.end();

//         if (result.affectedRows > 0) {
//             res.status(200).json({ message: 'Form updated successfully!' });
//         } else {
//             res.status(404).json({ error: 'Form not found.' });
//         }
//     } catch (error) {
//         console.error('Error updating form data:', error);
//         res.status(500).json({ error: 'Failed to update form data.' });
//     }
// };

// // Asynchronous function to retrieve form data by its ID from the database.
// const getFormDataById = async (req, res) => {
//     // Extracts the formId from the request parameters.
//     const { formId } = req.params;

//     try {
//         // Establishes a new asynchronous connection to the MySQL database.
//         const connection = await mysql.createConnection(dbConfig);
//         // Executes an SQL SELECT query to retrieve the form_data for a specific form ID.
//         const [form] = await connection.execute('SELECT form_data FROM forms WHERE id = ?', [formId]);
//         // Closes the database connection.
//         await connection.end();

//         // Checks if any form record was found with the given ID.
//         if (form.length > 0) {
//             // If a form is found, return a 200 (OK) response with the form data (assuming form_data is the only column needed).
//             res.status(200).json(form[0]);
//         } else {
//             // If no form with the given ID was found, return a 404 (Not Found) error.
//             res.status(404).json({ error: 'Form not found.' });
//         }
//     } catch (error) {
//         // Catches any errors during the fetch process.
//         console.error('Error fetching form data by ID:', error);
//         // Returns a 500 (Internal Server Error) response with an error message.
//         res.status(500).json({ error: 'Failed to fetch form data.' });
//     }
// };

// // Exports the controller functions to be used in route definitions.
// module.exports = {
//     saveFormData, // Function to save new form data.
//     getAllFormsData, // Function to retrieve all form data.
//     updateFormData, // Function to update existing form data.
//     getFormDataById, // Function to retrieve form data by its ID.
// };