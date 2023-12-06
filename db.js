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

// Create the user table
const createUserTableQuery = `
  CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255),
    user_surname VARCHAR(255),
    user_tel_number VARCHAR(20),
    user_mail VARCHAR(255),
    user_status BOOLEAN,
    car_number VARCHAR(20),
    car_color VARCHAR(50),
    car_model VARCHAR(50),
    car_status BOOLEAN,
    meta_info TEXT,
    history TEXT,
    reg_time TIME,
    reg_date DATE,
    avatar BYTEA,
    rate INTEGER CHECK (rate >= 1 AND rate <= 5)
  );
`;

const createDriverTableQuery = `
  CREATE TABLE driver (
    id SERIAL PRIMARY KEY,
    driver_name VARCHAR(255),
    driver_surname VARCHAR(255),
    driver_tel_number VARCHAR(20),
    driver_mail VARCHAR(255),
    driver_status BOOLEAN,
    driver_pers_nr VARCHAR(20),
    driver_state BOOLEAN,
    meta_info TEXT,
    history TEXT,
    reg_time TIME,
    reg_date DATE,
    avatar BYTEA,
    rate INTEGER CHECK (rate >= 1 AND rate <= 5)
  );
`;

// Create the orders table
const createOrdersTableQuery = `
  CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id),
    user_name VARCHAR(255),
    user_tel_number VARCHAR(20),
    pickup_street VARCHAR(255),
    pickup_zip VARCHAR(20),
    pickup_city VARCHAR(255),
    pickup_time TIME,
    pickup_date DATE,
    destination_street VARCHAR(255),
    destination_zip VARCHAR(20),
    destination_city VARCHAR(255),
    car_number VARCHAR(20),
    car_color VARCHAR(50),
    car_model VARCHAR(50),
    price DECIMAL(10, 2),
    payment_status BOOLEAN,
    order_status VARCHAR(50),
    meta_info TEXT
  );
`;

const createHistoryTableQuery = `
  CREATE TABLE history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    time TIME,
    date DATE,
    meta_info TEXT
  );
`

const select = `
    SELECT * FROM "user";
`;

// Function to initialize the database
async function initializeDatabase() {
  try {
    await pool.query(select);
    console.log('DB connected');
  } catch (err) {
    console.error('Error DB connection:', err);
  } finally {
    // Close the connection pool
    pool.end();
  }
}

async function creatTabeles() {
  try {
    // await pool.query(createUserTableQuery);
    // await pool.query(createDriverTableQuery);
    // await pool.query(createOrdersTableQuery);
    await pool.query(createHistoryTableQuery);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    // Close the connection pool
    pool.end();
  }
}

// Export the initializeDatabase function
module.exports = { initializeDatabase, creatTabeles };
