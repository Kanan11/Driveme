const { Pool } = require('pg');
require('dotenv').config();

// Read from the environment variables
const dbUser = process.env.DB_USER;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbPassword = process.env.DB_PASSWORD;
const port = process.env.DB_PORT;

// Create a connection pool for PostgreSQL
const pool = new Pool({
  user: dbUser,
  host: host,
  database: dbName,
  password: dbPassword,
  port: port,
});

// Test the history table connection
async function testHistoryTableConnection() {
  const client = await pool.connect();

  try {
    // Perform a simple query
    const result = await client.query('SELECT $1::text as message', ['Hello, History Table!']);
    console.log('Query Result:', result.rows[0].message);

    // Generate and insert a random order and its corresponding history entry
    await generateAndInsertRandomOrderWithHistory(client);
  } catch (error) {
    console.error('Error testing history table connection:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the connection pool
    pool.end();
  }
}

async function generateAndInsertRandomOrderWithHistory(client) {
  // Generate random order data
  const orderData = generateRandomOrder();
  
  try {
    await client.query('BEGIN'); // Start a transaction

    // Insert into the orders table and retrieve the order ID
    const orderInsertResult = await client.query(
      `INSERT INTO orders (user_id, user_name, user_tel_number, pickup_street, pickup_zip, pickup_city, pickup_time, pickup_date, destination_street, destination_zip, destination_city, car_number, car_color, car_model, price, payment_status, order_status, meta_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      Object.values(orderData)
    );

    const orderId = orderInsertResult.rows[0].id;

    // Generate random history data
    const historyData = generateRandomHistory(orderId);

    // Insert into the history table
    await client.query(
      `INSERT INTO history (order_id, time, date, meta_info)
       VALUES ($1, $2, $3, $4)`,
      Object.values(historyData)
    );

    await client.query('COMMIT'); // Commit the transaction
    console.log('Random order and history entry inserted successfully.');
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction in case of an error
    console.error('Error generating and inserting random order with history:', error);
  }
}

function generateRandomOrder() {
  // Generate random order data
  return {
    user_id: getRandomInteger(1, 5), // Assuming you have users with IDs 1 to 5
    user_name: getRandomString(),
    user_tel_number: getRandomPhoneNumber(),
    pickup_street: getRandomString(),
    pickup_zip: getRandomString(),
    pickup_city: getRandomString(),
    pickup_time: getRandomTime(),
    pickup_date: getRandomDate(),
    destination_street: getRandomString(),
    destination_zip: getRandomString(),
    destination_city: getRandomString(),
    car_number: getRandomString(),
    car_color: getRandomString(),
    car_model: getRandomString(),
    price: getRandomDecimal(10, 1000), // Adjust the range as needed
    payment_status: getRandomBoolean(),
    order_status: getRandomString(),
    meta_info: getRandomString(),
  };
}

function generateRandomHistory(orderId) {
  // Generate random history data
  return {
    order_id: orderId,
    time: getRandomTime(),
    date: getRandomDate(),
    meta_info: getRandomString(),
  };
}

// Helper functions
function getRandomString() {
  return Math.random().toString(36).substring(7);
}

function getRandomPhoneNumber() {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
}

function getRandomBoolean() {
  return Math.random() < 0.5;
}

function getRandomTime() {
  return new Date(null).toTimeString().slice(0, 8);
}

function getRandomDate() {
  const year = getRandomInteger(2000, 2023);
  const month = getRandomInteger(1, 12);
  const day = getRandomInteger(1, 28); // Assuming all months have 28 days for simplicity
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function getRandomDecimal(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Call the test function for the history table
testHistoryTableConnection();
