// database.js
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost', // Replace with your database host
    user: 'root',      // Replace with your database user
    password: 'root',  // Replace with your database password
    database: 'dynamic_screen_db', // Replace with your database name
    waitForConnections: true,
    connectionLimit: 10, // Adjust as needed
    queueLimit: 0
};

let pool; // Declare pool globally (or export it)

// Function to initialize the connection pool
async function initializeDatabasePool() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('MySQL connection pool created!');

        // Optional: Test connection to ensure it's working
        const connection = await pool.getConnection();
        console.log('Successfully tested connection from pool!');
        connection.release(); // Release the connection immediately after testing

    } catch (error) {
        console.error('Error creating MySQL connection pool:', error);
        process.exit(1); // Exit if pool creation fails
    }
}

// Function to get a connection from the pool
async function getConnection() {
    if (!pool) {
        throw new Error('Database connection pool not initialized. Call initializeDatabasePool() first.');
    }
    return await pool.getConnection(); // Returns a connection object from the pool
}

module.exports = {
    initializeDatabasePool,
    getConnection
};