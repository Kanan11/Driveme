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

// Define the external order object
const order = {
    order_id: 3,
    order_status: 'Processing',
    user_name: 'Jane Doe',
    user_tel_number: '987-654-3210',
    pickup_street: '456 Oak St',
    pickup_zip: '54321',
    pickup_city: 'Villagetown',
    pickup_time: '15:30:00',
    pickup_date: '2023-12-26',
    destination_street: '789 Pine St',
    destination_zip: '87654',
    destination_city: 'Cityburg',
    car_number: 'XYZ789',
    car_color: 'Red',
    car_model: 'Model Y',
    price: 200.00,
    payment_status: false,
    meta_info: 'More details'
};

const additionalParameter = 'New notification added';


// Function to generate the notification query for a new order
function generateNotificationNewOrderQuery() {
  // Hardcoded values for the new order
  const hardcodedValues = {
    order_id: order.order_id || 2,
    order_status: order.order_status || 'Pending',
    user_name: order.user_name || 'John Doe',
    user_tel_number: order.user_tel_number || '123-456-7890',
    pickup_street: order.pickup_street || '123 Main St',
    pickup_zip: order.pickup_zip || '12345',
    pickup_city: order.pickup_city || 'Cityville',
    pickup_time: order.pickup_time || '12:00:00',
    pickup_date: order.pickup_date || '2023-12-25',
    destination_street: order.destination_street || '456 Broad St',
    destination_zip: order.destination_zip || '67890',
    destination_city: order.destination_city || 'Townsville',
    car_number: order.car_number || 'ABC123',
    car_color: order.car_color || 'Blue',
    car_model: order.car_model || 'Model X',
    price: order.price || 150.00,
    payment_status: order.payment_status || true,
    meta_info: order.meta_info || 'Additional info'
  };

  // Generate the columns and values for the INSERT query
  const columns = Object.keys(hardcodedValues).join(', ');
  const values = Object.values(hardcodedValues).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ');

  // Generate the INSERT query for the notifications table
  const insertQuery = `
    INSERT INTO notifications (${columns}) VALUES (${values});
  `;

  // Generate the NOTIFY query to notify drivers with additional payload
  const notifyQuery = `
    NOTIFY new_notification, '${additionalParameter.additionalParameter}';
  `;

  // Combine the INSERT and NOTIFY queries into the final query
  const finalQuery = insertQuery + '\n' + notifyQuery + '\n';

  return finalQuery;
}

// Test the orders table connection
async function testOrdersTableConnection() {
  const client = await pool.connect();

  try {
    // Perform a simple query
    const result = await client.query('SELECT $1::text as message', ['Hello, Notification Table!']);
    console.log('Query Result:', result.rows[0].message);

    await client.query('BEGIN'); // Start a transaction
    await client.query(generateNotificationNewOrderQuery()); // Execute the insert query
    await client.query('COMMIT'); // Commit the transaction

    console.log('New order inserted successfully with notification.');
  } catch (error) {
    // Rollback the transaction in case of an error
    await client.query('ROLLBACK');
    console.error('Error testing orders table connection:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the connection pool
    pool.end();
  }
}

// Call the test function for the orders table
testOrdersTableConnection();
