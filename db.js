const { Client } = require('pg');
require('dotenv').config();
const { 
  createBankTableQuery,
  getUserTransactionHistoryQuery,
  getPartnerTransactionHistoryQuery,
  getDriverTransactionHistoryQuery,
  getUserOrderHistoryQuery,
  getPartnerOrderHistoryQuery,
  getDriverOrderHistoryQuery,
  createOrdersTableQuery,
  createPartnerDriversTableQuery,
  createPartnerTableQuery,
  createAddressTableQuery,
  createCarsTableQuery,
  createPartnerPaymentsTableQuery,
  createTransactionsTableQuery,
  createPaymentsTableQuery,
  createUsersTableQuery,
  createLocationsTableQuery
 } = require('./queries.js');

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initializeDatabase = async () => {
  try {
    await client.connect();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
};

const getTables = async () => {
    const queries = [
      getUserTransactionHistoryQuery,
      getPartnerTransactionHistoryQuery,
      getDriverTransactionHistoryQuery,
      getUserOrderHistoryQuery,
      getPartnerOrderHistoryQuery,
      getDriverOrderHistoryQuery,
    ]
  };

const createTables = async () => {
  const queries = [
    createCarsTableQuery,
    createBankTableQuery,
    createAddressTableQuery,
    createPartnerDriversTableQuery,
    createOrdersTableQuery,
    createPartnerPaymentsTableQuery,
    createTransactionsTableQuery,
    createPaymentsTableQuery,
    createPartnerTableQuery,
    createUsersTableQuery,
    createLocationsTableQuery,
  ];

  for (const query of queries) {
    try {
      await client.query(query);
      console.log('Table created successfully');
    } catch (err) {
      console.error('Error creating table', err);
    }
  }
};

module.exports = { 
  client, 
  initializeDatabase, 
  createTables,
  getTables,
};