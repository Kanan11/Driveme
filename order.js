const { Pool, Client } = require('pg');
require('dotenv').config();

// Read from the environment variables
const dbUser = process.env.DB_USER;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbPassword = process.env.DB_PASSWORD;
const port = process.env.DB_PORT

// Create a connection pool
const pool = new Pool({
    user: dbUser,
    host: host,
    database: dbName,
    password: dbPassword,
    port: port,
  });

// Define the external order object
const order = {
    id: 11,
    driver_id: null,
    user_id: null,
    driver_name:'Ivan',
    driver_tel_number: 'Smirnov',
    user_name: 'Carl',
    user_tel_number: '0707070707',
    pickup_street: 'Vasagatan 5',
    pickup_zip: '415555',
    pickup_city: 'Göteborg',
    pickup_time: '15:30:00',
    pickup_date: '2023-12-26',
    destination_street: '789 Pine St',
    destination_zip: '87654',
    destination_city: 'Cityburg',
    car_number: 'XYZ789',
    car_color: 'Red',
    car_model: 'Model Y',
    price: 200.00,
    paid: true,
    payment_method: 'Swish',
    meta_info: 'TEXT',
    order_status: 'Processing',
    payment_status: false,
    meta_info: 'More details'
};


  // Close the connection pool and client when the application exits
process.on('exit', () => {
    pool.end();
  });