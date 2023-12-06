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

// Test the orders table connection
async function testOrdersTableConnection() {
  const client = await pool.connect();

  try {
    // Perform a simple query
    const result = await client.query('SELECT $1::text as message', ['Hello, Orders Table!']);
    console.log('Query Result:', result.rows[0].message);

    // Generate and insert 5 random orders
    await generateAndInsertRandomOrders(5, client);
  } catch (error) {
    console.error('Error testing orders table connection:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the connection pool
    pool.end();
  }
}

async function generateAndInsertRandomOrders(numOrders, client) {
  const insertQuery = generateOrderInsertQuery(generateRandomOrders(numOrders));

  try {
    await client.query('BEGIN'); // Start a transaction

    await client.query(insertQuery); // Execute the insert query

    await client.query('COMMIT'); // Commit the transaction
    console.log(`${numOrders} random orders inserted successfully.`);
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction in case of an error
    console.error('Error inserting random orders:', error);
  }
}

function generateOrderInsertQuery(orders) {
  const columns = Object.keys(orders[0]).join(', ');
  const values = orders.map(order =>
    '(' + Object.values(order).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ') + ')'
  ).join(', ');

  const insertQuery = `INSERT INTO orders (${columns}) VALUES ${values}`;
  console.log('Generated Insert Query:', insertQuery); // Log the insert query
  return insertQuery;
}

function generateRandomOrders(numOrders) {
  const randomOrders = [];
  for (let i = 0; i < numOrders; i++) {
    randomOrders.push({
      user_id: getRandomInteger(1, 5), // Assuming have users with IDs 1 to 5
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
      price: getRandomDecimal(10, 1000),
      payment_status: getRandomBoolean(),
      order_status: getRandomString(),
      meta_info: getRandomString(),
    });
  }
  return randomOrders;
}

// Helper functions (similar to the previous files)
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

// Call the test function for the orders table
testOrdersTableConnection();
