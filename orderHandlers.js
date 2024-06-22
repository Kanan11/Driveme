const { Client } = require('pg');
const { io } = require('./app');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect();

const createOrder = async (orderData, paymentData) => {
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
  }
};

const assignDriverToOrder = async (orderId, driverId) => {
  try {
    const updateOrderQuery = `
      UPDATE Orders
      SET driver_id = $1, order_status = 'accepted'
      WHERE id = $2;
    `;
    await client.query(updateOrderQuery, [driverId, orderId]);

    // Notify user and other drivers via Socket.IO
    io.emit('order_assigned', { orderId, driverId });
  } catch (error) {
    throw error;
  }
};

const completeOrder = async (orderId, userId, partnerId, driverId, paymentAmount) => {
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

    // Notify user and driver via Socket.IO
    io.emit('order_completed', { orderId });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

const processWeeklyPayments = async () => {
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
  }
};

const getOrderHistory = async (userId) => {
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
  }
};

module.exports = {
  createOrder,
  assignDriverToOrder,
  completeOrder,
  processWeeklyPayments,
  getOrderHistory
};
