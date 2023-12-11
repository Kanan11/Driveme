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

// Test the database connection
async function testDatabaseConnection() {
  const client = await pool.connect();

  try {
    // Perform a simple query
    const result = await client.query('SELECT $1::text as message', ['Hello, Database!']);
    console.log('Query Result:', result.rows[0].message);

    // Generate and insert 5 random users
    await generateAndInsertRandomUsers(5, client);

  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the connection pool
    pool.end();
  }
}

async function generateAndInsertRandomUsers(numUsers, client) {
  const insertQuery = generateInsertQuery(generateRandomUsers(numUsers));

  try {
    await client.query('BEGIN'); // Start a transaction

    await client.query(insertQuery); // Execute the insert query

    await client.query('COMMIT'); // Commit the transaction
    console.log(`${numUsers} random users inserted successfully.`);
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback the transaction in case of an error
    console.error('Error inserting random users:', error);
  }
}

function generateInsertQuery(users) {
  const columns = Object.keys(users[0]).join(', ');
  const values = users.map(user =>
    '(' + Object.values(user).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ') + ')'
  ).join(', ');

  return `INSERT INTO users (${columns}) VALUES ${values}`;
}

function generateRandomUsers(numUsers) {
  const randomUsers = [];
  for (let i = 0; i < numUsers; i++) {
    randomUsers.push({
      user_name: getRandomString(),
      user_surname: getRandomString(),
      user_tel_number: getRandomPhoneNumber(),
      user_mail: getRandomEmail(),
      user_status: getRandomBoolean(),
      car_number: getRandomString(),
      car_color: getRandomString(),
      car_model: getRandomString(),
      car_status: getRandomBoolean(),
      meta_info: getRandomString(),
      history: getRandomString(),
      reg_time: getRandomTime(),
      reg_date: getRandomDate(),
      avatar: getRandomAvatar(),
      rate: getRandomInteger(1, 5),
    });
  }
  return randomUsers;
}

function getRandomString() {
  return Math.random().toString(36).substring(7);
}

function getRandomPhoneNumber() {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
}

function getRandomEmail() {
  return `${getRandomString()}@example.com`;
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

function getRandomAvatar() {
  return '\\x' + Buffer.from(getRandomString()).toString('hex');
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Call the test function
testDatabaseConnection();
