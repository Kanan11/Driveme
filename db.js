const { Pool } = require('pg');

// Create a connection pool for PostgreSQL
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'driveme',
  password: 'max',
  port: 5432,
});

// Create the customer table
const createCustomerTableQuery = `
  CREATE TABLE IF NOT EXISTS "customer" (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(50) NOT NULL,
    meta JSONB NOT NULL,
    user_id INTEGER REFERENCES "user"(id) NOT NULL
  );
`;

// Create the user table
const createUserTableQuery = `
  CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    telefon VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    customer_id INTEGER,
    meta JSONB NOT NULL
);
`;

// Create the car table
const createCarTableQuery = `
  CREATE TABLE IF NOT EXISTS "car" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) NOT NULL,
    number VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    meta JSONB NOT NULL
  );
`;

// Create the orders table
const createOrdersTableQuery = `
  CREATE TABLE IF NOT EXISTS "orders" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) NOT NULL,
    meta JSONB NOT NULL
  );
`;

// Function to initialize the database
async function initializeDatabase() {
  try {
    await pool.query(createCustomerTableQuery);
    await pool.query(createUserTableQuery);
    await pool.query(createCarTableQuery);
    await pool.query(createOrdersTableQuery);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    // Close the connection pool
    pool.end();
  }
}

// Export the initializeDatabase function
module.exports = { initializeDatabase };
