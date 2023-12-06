const express = require('express');
const { initializeDatabase, creatTabeles } = require('./db');

const app = express();
const port = 3000;

// Initialize the database when the application starts
// initializeDatabase();
creatTabeles();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
