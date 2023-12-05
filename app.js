const express = require('express');
const { initializeDatabase } = require('./db'); // Adjust the path based on your file structure

const app = express();
const port = 3000;

// Initialize the database when the application starts
initializeDatabase();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
