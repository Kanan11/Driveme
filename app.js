const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const apiRoutes = require('./api.js');
const { initializeDatabase, createTables } = require('./db.js');
const { Client } = require('pg');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware for JSON requests
app.use(express.json());

// Initialize database and create tables (assuming these are synchronous functions)
initializeDatabase();
createTables();

// API routes
app.use('/api', apiRoutes);

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

console.log('------>>');
// Function for connecting to PostgreSQL
const connectToDatabase = async () => {
  const dbUser = process.env.DB_USER;
  const host = process.env.DB_HOST;
  const dbName = process.env.DB_NAME;
  const dbPassword = process.env.DB_PASSWORD;
  const port = process.env.DB_PORT;
  
  const client = new Client({
    user: dbUser,
    host: host,
    database: dbName,
    password: dbPassword,
    port: port,
  });
  
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    return client;
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error.message);
    throw error;
  }
};

// Export both io and connectToDatabase
module.exports = { io, connectToDatabase };



// demo code to use connection in other file if need DB connection

/* 
const { connectToDatabase } = require('./app.js');

// Example usage:
async function someFunction() {
  try {
    const client = await connectToDatabase();
    // Use the client to perform database operations
    // For example:
    const result = await client.query('SELECT * FROM some_table');
    console.log(result.rows);
  } catch (error) {
    console.error('Error in database operation:', error.message);
  }
} 
*/

/* 
// this code should be moved from here
const createOrder = async (orderData, paymentData) => {
  const client = new Client({
    connectionString: 'connection-string-here'
  });

  await client.connect();
  
  try {
    await client.query('BEGIN');
    
    const insertOrderQuery = `
      INSERT INTO Orders (type_order, user_id, partner_id, start_location, end_location, distance, price, payment_mode)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
      `;
    const orderValues = [orderData.type_order, orderData.user_id, orderData.partner_id, orderData.start_location, orderData.end_location, orderData.distance, orderData.price, orderData.payment_mode];
    const orderResult = await client.query(insertOrderQuery, orderValues);
    const orderId = orderResult.rows[0].id;
    
    const insertTransactionQuery = `
      INSERT INTO Transactions (user_id, partner_id, order_id, amount, transaction_type)
      VALUES ($1, $2, $3, $4, 'payment_received');
    `;
    const transactionValues = [paymentData.user_id, paymentData.partner_id, orderId, paymentData.amount];
    await client.query(insertTransactionQuery, transactionValues);
    
    await client.query('COMMIT');
    
    // Notify drivers via Socket.IO
    io.emit('new_order', { orderId, orderData });

    return orderId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};


// in case if driver accepted the order
const assignDriverToOrder = async (orderId, driverId) => {
  const client = new Client({
    connectionString: 'connection-string-here'
  });
  
  await client.connect();
  
  try {
    const updateOrderQuery = `
      UPDATE Orders
      SET driver_id = $1, order_status = 'accepted'
      WHERE id = $2;
      `;
    const values = [driverId, orderId];
    await client.query(updateOrderQuery, values);

    // Notify user and other drivers via Socket.IO
    io.emit('order_assigned', { orderId, driverId });

  } catch (error) {
    throw error;
  } finally {
    await client.end();
  }
};


// order is completed 
const completeOrder = async (orderId, userId, partnerId, driverId, paymentAmount) => {
  const client = new Client({
    connectionString: 'your-connection-string-here'
  });

  await client.connect();
  
  try {
    await client.query('BEGIN');

    const updateOrderQuery = `
      UPDATE Orders
      SET order_status = 'completed'
      WHERE id = $1;
      `;
    await client.query(updateOrderQuery, [orderId]);

    const insertTransactionQuery = `
      INSERT INTO Transactions (user_id, partner_id, driver_id, order_id, amount, transaction_type)
      VALUES ($1, $2, $3, $4, $5, 'partner_payment');
      `;
    await client.query(insertTransactionQuery, [userId, partnerId, driverId, orderId, paymentAmount * 0.9]);
    
    await client.query('COMMIT');

    // notify user and driver that is order is done using by Socket.IO
    io.emit('order_completed', { orderId });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};


// weekly payment to partners 
const processWeeklyPayments = async () => {
  const client = new Client({
    connectionString: 'connection-string-here'
  });
  
  await client.connect();
  
  try {
    await client.query('BEGIN');

    const selectCompletedOrdersQuery = `
      SELECT partner_id, driver_id, SUM(price) as total_amount
      FROM Orders
      WHERE order_status = 'completed' AND start_date >= NOW() - INTERVAL '1 week'
      GROUP BY partner_id, driver_id;
      `;
      const result = await client.query(selectCompletedOrdersQuery);

    for (const row of result.rows) {
      const { partner_id, driver_id, total_amount } = row;

      const insertTransactionQuery = `
        INSERT INTO Transactions (partner_id, driver_id, amount, transaction_type)
        VALUES ($1, $2, $3, 'partner_weekly_payment');
      `;
      await client.query(insertTransactionQuery, [partner_id, driver_id, total_amount * 0.9]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};


// get history of orders
const getOrderHistory = async (userId) => {
  const client = new Client({
    connectionString: 'connection-string-here'
  });

  await client.connect();
  
  try {
    const selectOrdersQuery = `
      SELECT * FROM Orders
      WHERE user_id = $1
      ORDER BY start_date DESC, start_time DESC;
      `;
      const result = await client.query(selectOrdersQuery, [userId]);
      return result.rows;
  } catch (error) {
    throw error;
  } finally {
    await client.end();
  }
};

*/