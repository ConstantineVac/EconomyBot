// Import the MongoClient class from the mongodb module
const { MongoClient } = require('mongodb');

// Define the MongoDB connection URL
const uri = process.env.DB_URI;

// Create a new MongoClient instance, passing the connection URL
const client = new MongoClient(uri);

// Declare a variable to hold the reference to the database
let database;

// Define an asynchronous function to connect to MongoDB
async function connect() {
    try {
        // Use the connect method of the MongoClient instance to connect to the MongoDB cluster
        await client.connect();
        console.log('✅ Connected to the database');
        // Get a reference to the database and assign it to the 'database' variable
        // Replace 'cluster0' with your preferred database name
        database = client.db(process.env.DB_CLUSTER); 
    } catch (error) {
        // If there's an error during the connection, log it to the console
        console.error('Error connecting to MongoDB:', error);
    }
}

// Define a function to get the database
function getDatabase() {
    // If the 'database' variable is not defined (i.e., the database is not connected), throw an error
    if (!database) {
        throw new Error('Database not connected');
    }
    // If the 'database' variable is defined, return it
    return database;
}

// Export the 'connect' and 'getDatabase' functions so they can be imported and used in other files
module.exports = { connect, getDatabase };


