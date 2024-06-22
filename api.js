const express = require('express');
const { client } = require('./db');
const { getUserTransactionHistoryQuery, getUserOrderHistoryQuery } = require('./queries');
const { createOrder, assignDriverToOrder, completeOrder, processWeeklyPayments, getOrderHistory } = require('./orderHandlers');
const router = express.Router();

router.get('/user/:id/transactions', async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await client.query(getUserTransactionHistoryQuery, [userId]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/user/:id/orders', async (req, res) => {
  const userId = req.params.id;
  try {
    const result = await client.query(getUserOrderHistoryQuery, [userId]);
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).send(err);
  }
});



module.exports = router;
