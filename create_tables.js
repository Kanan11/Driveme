const { Client } = require('pg');
require('dotenv').config();

// Read from the environment variables
const dbUser = process.env.DB_USER;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbPassword = process.env.DB_PASSWORD;
const port = process.env.DB_PORT

const client = new Client({
  user: dbUser,
  host: host,
  database: dbName,
  password: dbPassword,
  port: port,
});

client.connect();

const createPartnerTableQuery = `
  CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    partner_name VARCHAR(255) NOT NULL,
    partner_mail VARCHAR(255) NOT NULL UNIQUE,
    partner_password VARCHAR(255) NOT NULL,
    logo BYTEA,
    partner_tel_number VARCHAR(20),
    partner_status BOOLEAN DEFAULT TRUE,
    partner_org_nr VARCHAR(20) NOT NULL, /* VAT number */
    partner_bank_id INTEGER REFERENCES Bank(id) ON DELETE SET NULL, /* Foreign key relationship */
    partner_address_id INTEGER REFERENCES Address(id) ON DELETE SET NULL, /* Foreign key relationship */
    partner_cars_id INTEGER REFERENCES Cars(id) ON DELETE SET NULL, /* Foreign key relationship */
    partner_drivers_id INTEGER REFERENCES Drivers(id) ON DELETE SET NULL, /* Foreign key relationship */
    partner_contract BYTEA, /* Save PDF file in DB */
    partner_options VARCHAR(255), /* Additional options that this partner can do (e.g., taxi, driver_service, and car_evolution) */
    meta_info TEXT,
    reg_time TIME DEFAULT CURRENT_TIME,
    reg_date DATE DEFAULT CURRENT_DATE,
    rate INTEGER CHECK (rate >= 1 AND rate <= 5)
  );
`;

const createPartnerBankTableQuery = `
  CREATE TABLE IF NOT EXISTS Bank (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    bank_account_number VARCHAR(20),
    bank_address VARCHAR(255),
    bank_phone_number VARCHAR(20),
    bank_email VARCHAR(255) UNIQUE,
    meta_info TEXT
  );
`;

const createPartnerAddressTableQuery = `
  CREATE TABLE IF NOT EXISTS Address (
    id SERIAL PRIMARY KEY,
    options VARCHAR(255), /* office or faktura adress */
    street VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255),
    postal_code VARCHAR(20),
    country VARCHAR(255) NOT NULL,
    meta_info TEXT
  );
`;

const createPartnerCarsTableQuery = `
  CREATE TABLE IF NOT EXISTS Cars (
    id SERIAL PRIMARY KEY,
    car_make VARCHAR(255) NOT NULL,
    car_model VARCHAR(255) NOT NULL,
    car_color VARCHAR(255) NOT NULL,
    car_year INTEGER CHECK (car_year > 2006), /* First car was made in 2006 */
    car_vin VARCHAR(17) UNIQUE NOT NULL, /* Standard VIN length */
    car_license_plate VARCHAR(20) UNIQUE NOT NULL,
    car_options VARCHAR(255) NOT NULL, /* have Child sets, can accept animals or not */
    car_photo BYTEA,
    rate INTEGER CHECK (rate >= 1 AND rate <= 5) DEFAULT 5,
    meta_info TEXT
  );
`;

const createPartnerDriversTableQuery = `
  CREATE TABLE IF NOT EXISTS Drivers (
    id SERIAL PRIMARY KEY,
    driver_profile BYTEA,
    driver_name VARCHAR(255) NOT NULL,
    driver_lastname VARCHAR(255) NOT NULL,
    driver_personal_number VARCHAR(20) UNIQUE NOT NULL,
    driver_taxi_leg_number VARCHAR(20) UNIQUE NOT NULL,
    driver_phone_number VARCHAR(20),
    driver_email VARCHAR(255) UNIQUE, /* will use to login */
    driver_password VARCHAR(255) NOT NULL,
    driver_options VARCHAR(255) NOT NULL, /* taxi driver or simple driver */
    driver_status VARCHAR(255) NOT NULL DEFAULT 'inactive', /* active or not */
    rate INTEGER CHECK (rate >= 1 AND rate <= 5) DEFAULT 5,
    meta_info TEXT
  );
`;

const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_lastname VARCHAR(255) NOT NULL,
    user_tel VARCHAR(20) NOT NULL,
    user_mail VARCHAR(255) UNIQUE NOT NULL, /* will use to login */
    user_password VARCHAR(255) NOT NULL,
    user_status BOOLEAN DEFAULT TRUE,
    user_option VARCHAR(20), /* simple user or with car */
    user_bank_id INTEGER REFERENCES Bank(id) ON DELETE SET NULL, /* Foreign key relationship */
    user_address_id INTEGER REFERENCES Address(id) ON DELETE SET NULL, /* Foreign key relationship */
    user_cars_id INTEGER REFERENCES Cars(id) ON DELETE SET NULL, /* Foreign key relationship */
    meta_info TEXT,
    reg_time TIME DEFAULT CURRENT_TIME,
    reg_date DATE DEFAULT CURRENT_DATE,
    profile BYTEA,
    rate INTEGER CHECK (rate >= 1 AND rate <= 5) DEFAULT 5
  );
`;

const createOrdersTableQuery = `
  CREATE TABLE IF NOT EXISTS Orders (
    id SERIAL PRIMARY KEY,
    type_order VARCHAR(20) NOT NULL, /* taxi, only driver, evacuator */
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE, /* which user was created this order */
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL, /* Foreign key relationship to partner */
    driver_id INTEGER REFERENCES Drivers(id) ON DELETE SET NULL, /* Will be assigned later */
    car_id INTEGER REFERENCES Cars(id) ON DELETE SET NULL, /* Will be assigned later */
    start_date DATE DEFAULT CURRENT_DATE, /* Date of the order start */
    start_time TIME DEFAULT CURRENT_TIME, /* Time of the order start */
    start_location VARCHAR(255) NOT NULL, /* street name and number and city */
    end_location VARCHAR(255),
    distance FLOAT, /* in kilometers or miles */
    price DECIMAL(10, 2), /* will calculate by function, depend two addresses */
    payment_mode VARCHAR(50) DEFAULT 'card', /* card, swish, cash */
    payment_status VARCHAR(50) DEFAULT 'pending', /* e.g., pending, completed, failed */
    order_status VARCHAR(50) DEFAULT 'pending', /* e.g., pending, accepted, in_progress, completed, cancelled */
    meta_info TEXT
  );
`;

const createPaymentsTableQuery = `
  CREATE TABLE IF NOT EXISTS Payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES Orders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'card', /* card, swish, cash */
    payment_status VARCHAR(50) DEFAULT 'pending', /* e.g., pending, completed, failed */
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meta_info TEXT
  );
`;

const createTransactionsTableQuery = `
  CREATE TABLE IF NOT EXISTS Transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    driver_id INTEGER REFERENCES Drivers(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES Orders(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, /* e.g., payment_received, partner_payment */
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meta_info TEXT
  );
`;

const createPartnerPaymentsTableQuery = `
  CREATE TABLE IF NOT EXISTS PartnerPayments (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meta_info TEXT
  );
`;

const getUserTransactionHistoryQuery = `
  SELECT * FROM Transactions WHERE user_id = $1 ORDER BY transaction_time DESC;
`;
const getPartnerTransactionHistoryQuery = `
  SELECT * FROM Transactions WHERE partner_id = $1 ORDER BY transaction_time DESC;
`;
const getDriverTransactionHistoryQuery = `
  SELECT * FROM Transactions WHERE driver_id = $1 ORDER BY transaction_time DESC;
`;
const getUserOrderHistoryQuery = `
  SELECT * FROM Orders WHERE user_id = $1 ORDER BY start_time DESC;
`;
const getPartnerOrderHistoryQuery = `
  SELECT * FROM Orders WHERE partner_id = $1 ORDER BY start_time DESC;
`;
const getDriverOrderHistoryQuery = `
  SELECT * FROM Orders WHERE driver_id = $1 ORDER BY start_time DESC;
`;


const queries = [
  createPartnerBankTableQuery,
  createPartnerAddressTableQuery,
  createPartnerDriversTableQuery,
  createPartnerCarsTableQuery,
  createPartnerTableQuery,
  createUsersTableQuery,
  createOrdersTableQuery,
  createPaymentsTableQuery,
];

(async () => {
  for (const query of queries) {
    try {
      await client.query(query);
      console.log('Table created successfully');
    } catch (err) {
      console.error('Error creating table', err);
    }
  }
  client.end();
})();