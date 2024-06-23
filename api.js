const express = require('express');
const { client } = require('./db.js');
const {
  getUserTransactionHistoryQuery,
  getUserOrderHistoryQuery,
  // Other queries imported from ./queries.js
} = require('./queries.js');

const apiRoutes = express();

// Route to get user transactions
apiRoutes.get('/api/user/:id/transactions', async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await client.query(getUserTransactionHistoryQuery, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching user transactions:', error.message);
    res.status(500).send(error.message);
  }
});

// Route to get user orders
apiRoutes.get('/api/user/:id/orders', async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await client.query(getUserOrderHistoryQuery, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching user orders:', error.message);
    res.status(500).send(error.message);
  }
});

// Export the API routes
module.exports = apiRoutes;
