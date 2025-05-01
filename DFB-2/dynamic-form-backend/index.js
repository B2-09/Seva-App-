const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const formController = require('./formController');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Secret key (should be in an environment variable)
const secretKey = 'PPAPPPAPPineApplePenAPPLEpen'; // CHANGE THIS TO A SECURE VALUE

// --- Helper Function ---
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.auth = decoded; // Store the decoded payload in req.auth for later use
        next(); // Call the next middleware or route handler
    });
};

// --- Authentication Routes ---
app.post('/api/register', formController.registerUser); // Register new user
app.post('/api/login', formController.loginUser);     // User login
app.get('/api/user', verifyToken, formController.getUserData); //get user data, protected

// --- Form Routes ---
//  These routes are now protected by the verifyToken middleware
app.post('/api/save-form', verifyToken, formController.saveFormData);
app.get('/api/get-forms', formController.getAllFormsData);
app.put('/api/update/:formId', verifyToken, formController.updateFormData);
app.get('/api/get-form/:formId', formController.getFormDataById);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const formController = require('./formController');
// const jwt = require('jsonwebtoken');

// const app = express();
// const port = 5000;

// app.use(cors());
// app.use(bodyParser.json());

// // Secret key (should be in an environment variable)
// const secretKey = 'PPAPPPAPPineApplePenAPPLEpen'; // CHANGE THIS TO A SECURE VALUE

// // Middleware for JWT authentication

// // --- Authentication Routes ---
// app.post('/api/register', formController.registerUser); // Register new user
// app.post('/api/login', formController.loginUser);     // User login
// app.get('/api/user', formController.getUserData); //get user data

// // --- Form Routes ---
// app.post('/api/save-form', formController.saveFormData);
// app.get('/api/get-forms', formController.getAllFormsData);
// app.put('/api/update/:formId', formController.updateFormData);
// app.get('/api/get-form/:formId', formController.getFaormDataById);

// app.listen(port, () => {
//     console.log(`Server listening on port ${port}`);
// });


// const express = require('express'); // Imports the Express.js framework for building web applications.
// const bodyParser = require('body-parser'); // Imports the body-parser middleware to parse request bodies.
// const cors = require('cors'); // Imports the CORS middleware to enable Cross-Origin Resource Sharing.
// const formController = require('./formController'); // Imports the form controller module containing route handlers.
// const jwt = require('jsonwebtoken'); // Import the Json web token

// // Creates an instance of the Express application.
// const app = express();
// // Defines the port on which the server will listen for incoming requests.
// const port = 5000;

// // Uses the CORS middleware to allow requests from different origins (e.g., your frontend).
// app.use(cors());
// // Uses the body-parser middleware to parse incoming requests with JSON payloads.
// app.use(bodyParser.json());

// // Defines a POST route at '/api/save-form' that uses the saveFormData function from the formController.
// // This route is likely used to save new dynamic form definitions to the database.
// app.post('/api/save-form', formController.saveFormData);

// // Defines a GET route at '/api/get-forms' that uses the getAllFormsData function from the formController.
// // This route is likely used to retrieve a list of all saved dynamic form definitions.
// app.get('/api/get-forms', formController.getAllFormsData);

// // Defines a PUT route at '/api/update/:formId' that uses the updateFormData function from the formController.
// // The ':formId' part is a route parameter that allows you to specify which form to update.
// // This route is likely used to update an existing dynamic form definition based on its ID.
// app.put('/api/update/:formId', formController.updateFormData);

// // Defines a GET route at '/api/get-form/:formId' that uses the getFormDataById function from the formController.
// // The ':formId' route parameter allows you to request a specific form by its ID.
// // This route is likely used to retrieve the details of a single dynamic form based on its ID.
// app.get('/api/get-form/:formId', formController.getFormDataById);

// // Starts the Express server and makes it listen for incoming connections on the specified port.
// // Once the server starts, it executes the provided callback function, which logs a message to the console.
// app.listen(port, () => {
//     console.log(`Server listening on port ${port}`);
// });