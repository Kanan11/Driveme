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

// Create a PostgreSQL client for listening to notifications
const client = new Client({
    user: dbUser,
    host: host,
    database: dbName,
    password: dbPassword,
    port: port,
});
client.connect();

// Set up a listener for the 'new_notification' channel
client.query('LISTEN new_notification');

// Listen for notifications and fetch new data
client.on('notification', async (msg) => {
  if (msg.channel === 'new_notification') {
    console.log('New notification received:', msg.payload);
    await fetchNotifications();
  }
});

// Function to fetch new notifications
async function fetchNotifications() {
  const query = 'SELECT * FROM notifications';
  const result = await pool.query(query);
  const notifications = result.rows;
  console.log('Notifications:', notifications);
}

// Close the connection pool and client when the application exits
process.on('exit', () => {
  pool.end();
  client.end();
});
