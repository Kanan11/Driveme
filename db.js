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
  CREATE TABLE IF NOT EXISTS users (
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
  CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    driver_name VARCHAR(255),
    driver_surname VARCHAR(255),
    driver_tel_number VARCHAR(20),
    driver_mail VARCHAR(255),
    driver_status BOOLEAN,
    driver_pers_nr VARCHAR(20),
    driver_state VARCHAR(50),
    driver_license BYTEA,
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
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    driver_id INTEGER REFERENCES drivers(id) NULL,
    driver_name VARCHAR(255),
    driver_tel_number VARCHAR(20),
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
    paid BOOLEAN,
    payment_status VARCHAR(50),
    payment_method VARCHAR(50),
    order_status VARCHAR(50),
    meta_info TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`;

const createHistoryTableQuery = `
  CREATE TABLE IF NOT EXISTS history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    time TIME,
    date DATE,
    meta_info TEXT
  );
`;

const createNotificationTable = `
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    order_status VARCHAR(50),
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
    meta_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Insert a notification with hardcoded values
const notifyDrivers = `
  INSERT INTO notifications (
    order_id,
    order_status,
    user_name,
    user_tel_number,
    pickup_street,
    pickup_zip,
    pickup_city,
    pickup_time,
    pickup_date,
    destination_street,
    destination_zip,
    destination_city,
    car_number,
    car_color,
    car_model,
    price,
    payment_status,
    meta_info
  ) VALUES (
    2,                           -- Hardcoded order_id
    'Pending',                   -- Hardcoded order_status
    'John Doe',                  -- Hardcoded user_name
    '123-456-7890',              -- Hardcoded user_tel_number
    '123 Main St',               -- Hardcoded pickup_street
    '12345',                     -- Hardcoded pickup_zip
    'Cityville',                 -- Hardcoded pickup_city
    '12:00:00',                  -- Hardcoded pickup_time
    '2023-12-25',                -- Hardcoded pickup_date
    '456 Broad St',              -- Hardcoded destination_street
    '67890',                     -- Hardcoded destination_zip
    'Townsville',                -- Hardcoded destination_city
    'ABC123',                    -- Hardcoded car_number
    'Blue',                      -- Hardcoded car_color
    'Model X',                   -- Hardcoded car_model
    150.00,                      -- Hardcoded price
    TRUE,                        -- Hardcoded payment_status
    'Additional info'            -- Hardcoded meta_info
  );

  -- Notify drivers with additional payload
  NOTIFY new_notification, 'New notification added';
`;



// const select = `
//     SELECT * FROM "user";
// `;

// // Function to initialize the database
// async function initializeDatabase() {
//   try {
//     await pool.query(select);
//     console.log('DB connected');
//   } catch (err) {
//     console.error('Error DB connection:', err);
//   } finally {
//     // Close the connection pool
//     // pool.end();
//   }
// }


//-------- small get user func ----------
let user;
const user_id = 11;
const selectUserQuery = `
  SELECT * FROM users WHERE id = ${user_id};
`;

async function getUser() {
  try {
    const response = await pool.query(selectUserQuery);
    user = response.rows[0];
    // console.log(user);
  } catch (err) {
    console.error('Error DB connection:', err);
  } finally {
    // Close the connection pool
    pool.end();
  }
};

// Use an async function to await the asynchronous call
(async () => {
  await getUser();
  console.log('user--->>', user);
})();
//-------- END ----------



const orderData = {
  user_id: 6,
  driver_id: null,
  // driver_name: 'Ivan',
  // driver_tel_number: 'Smirnov',
  // user_name: user.user_name;
  // user_tel_number: user_tel_number:,
  pickup_street: 'Vasagatan 5',
  pickup_zip: '415555',
  pickup_city: 'Göteborg',
  pickup_time: '15:30:00',
  pickup_date: '2023-12-26',
  destination_street: '789 Pine St',
  destination_zip: '87654',
  destination_city: 'Cityburg',
  // car_number: user.car_number,
  // car_color: user.car_color,
  // car_model: user.car_model,
  price: 200.00,
  // paid: true,
  payment_status: true,
  payment_method: 'Swish',
  order_status: 'Pending',
  meta_info: 'More details'
};

const columns = Object.keys(orderData).join(', ');
const values = Object.values(orderData).map(value => {
  if (value === null) {
    return 'NULL';
  } else if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  } else {
    return value;
  }
}).join(', ');

const createNewOrder = `
  INSERT INTO orders (
    ${columns}
    ) VALUES (
      ${values}
      ) RETURNING id, driver_id, user_id, driver_name, driver_tel_number, user_name, user_tel_number, pickup_street, pickup_zip, pickup_city, pickup_time, pickup_date, destination_street, destination_zip, destination_city, car_number, car_color, car_model, price, paid, payment_status, payment_method, order_status, meta_info;
`;

// console.log(createNewOrder)


async function creatTabeles() {
  try {
    // await pool.query(createUserTableQuery);
    // await pool.query(createDriverTableQuery);
    // await pool.query(createOrdersTableQuery);
    // await pool.query(createHistoryTableQuery);
    // await pool.query(createNotificationTable);
    // await pool.query(notifyDrivers);
    await pool.query(createNewOrder);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    // Close the connection pool
    // pool.end();
  }
}

// Export the initializeDatabase function
module.exports = { getUser, creatTabeles };
