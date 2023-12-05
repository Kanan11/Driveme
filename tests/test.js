const { Pool } = require('pg');
require('dotenv').config();


// Read from the environment variables
const dbUser = process.env.DB_USER;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbPassword = process.env.DB_PASSWORD;
const port = process.env.DB_PORT

// Create a connection pool for PostgreSQL
const pool = new Pool({
  user: dbUser,
  host: host,
  database: dbName,
  password: dbPassword,
  port: port,
});

// Test the database connection
async function testDatabaseConnection() {
  try {
    // Connect to the database
    const client = await pool.connect();

    // Perform a simple query
    const result = await client.query('SELECT $1::text as message', ['Hello, Database!']);
    console.log('Query Result:', result.rows[0].message);

    // Release the client back to the pool
    client.release();
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    // Close the connection pool
    pool.end();
  }
}

// Call the test function
testDatabaseConnection();
