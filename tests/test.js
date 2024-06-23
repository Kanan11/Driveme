const tape = require('tape');
const { connectToDatabase } = require('../app'); // Adjust paths as per your project structure
const { createOrdersTableQuery, createPartnerDriversTableQuery, createPartnerCarsTableQuery, createBankTableQuery } = require('../queries'); // Adjust paths as per your project structure

tape.skip('Test Database Connection and CRUD Operations', async (t) => {
  t.plan(5); // Adjust the number based on how many assertions you are making

  let client;
  try {
    // Connect to database
    client = await connectToDatabase();
    t.pass('Connected to PostgreSQL database');

    // Test table creation
    const tableResult = await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
      )
    `);
    t.pass('Test table created successfully');

    // Test data insertion
    const insertResult = await client.query(`
      INSERT INTO test_table (name) VALUES ($1) RETURNING id, name
    `, ['Test Name']);
    t.ok(insertResult.rows[0].name === 'Test Name', 'Data inserted successfully');

    // Test data retrieval
    const selectResult = await client.query('SELECT * FROM test_table WHERE name = $1', ['Test Name']);
    t.ok(selectResult.rows.length === 1 && selectResult.rows[0].name === 'Test Name', 'Data retrieved successfully');

    // Clean up
    await client.query('DROP TABLE IF EXISTS test_table');
    t.pass('Test table dropped successfully');
  } catch (error) {
    t.fail(`Error during database test: ${error.message}`);
  } finally {
    // Close database connection
    if (client) {
      try {
        await client.end();
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database connection:', error.message);
      }
    }

    t.end(); // End the test
    process.exit(0); // Ensure the process exits after the test completes
  }
});


tape.skip('Test create order row, then delete it', async (t) => {
  t.plan(5); // Adjust the number based on how many assertions you are making

  let client;
  try {
    client = await connectToDatabase();
    t.pass('Connected to PostgreSQL database');

    // Ensure the Orders table exists
    await client.query(createOrdersTableQuery);
    t.pass('Orders table exists or created successfully');

    // Insert a test order
    const insertOrderQuery = `
      INSERT INTO Orders (
        type_order, user_id, start_location, payment_mode, payment_status, order_status
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, type_order
    `;
    const insertValues = ['taxi', 1, '123 Main St, City', 'card', 'pending', 'pending']; // Ensure user_id 1 exists in Users table
    const insertResult = await client.query(insertOrderQuery, insertValues);
    const orderId = insertResult.rows[0].id;
    t.ok(orderId, 'Order created successfully');

    // Verify the order creation
    const selectOrderQuery = 'SELECT * FROM Orders WHERE id = $1';
    const selectResult = await client.query(selectOrderQuery, [orderId]);
    t.equal(selectResult.rows[0].id, orderId, 'Order verified successfully');

    // Delete the test order
    const deleteOrderQuery = 'DELETE FROM Orders WHERE id = $1 RETURNING id';
    const deleteResult = await client.query(deleteOrderQuery, [orderId]);
    t.equal(deleteResult.rows[0].id, orderId, 'Order deleted successfully');

    // Verify the order deletion
    const verifyDeletionQuery = 'SELECT * FROM Orders WHERE id = $1';
    const verifyDeletionResult = await client.query(verifyDeletionQuery, [orderId]);
    t.equal(verifyDeletionResult.rowCount, 0, 'Order deletion verified successfully');
  } catch (error) {
    t.fail(`Error during database test: ${error.message}`);
  } finally {
    if (client) {
      await client.end(); // Ensure the client disconnects from the database
    }
    t.end();
  }
});


tape.skip('Test Create Driver', async (t) => {
    t.plan(7); 

    let client;
    try {
        client = await connectToDatabase();
        t.pass('Connected to PostgreSQL database');

        // Ensure the Drivers table exists or create it
        await client.query(createPartnerDriversTableQuery);
        t.pass('Drivers table exists or created successfully');

        // Insert a test driver
        const insertDriverQuery = `
            INSERT INTO Drivers (
                driver_name, driver_lastname, driver_personal_number,
                driver_taxi_leg_number, driver_phone_number, driver_email,
                driver_password, driver_options, driver_status, rate, meta_info
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, driver_name, driver_lastname
        `;
        const insertValues = [
            'John',
            'Doe',
            '1234567890',
            'TAXI123',
            '123456789',
            'john.doe@example.com',
            'password123',
            'taxi driver',
            'active',
            5,
            'Some additional info'
        ];
        const insertResult = await client.query(insertDriverQuery, insertValues);
        const driverId = insertResult.rows[0].id;
        t.ok(driverId, 'Driver created successfully');

        // Retrieve the inserted driver
        const selectDriverQuery = 'SELECT * FROM Drivers WHERE id = $1';
        const selectResult = await client.query(selectDriverQuery, [driverId]);
        t.equal(selectResult.rows.length, 1, 'Driver retrieved successfully');
        t.equal(selectResult.rows[0].driver_name, 'John', 'Driver name matches');

        // Delete the demo driver inserted during the test
        await client.query('DELETE FROM Drivers WHERE driver_personal_number = $1', ['1234567890']);
        t.pass('Deleted demo driver');

        // Close the database connection
        await client.end();
        t.pass('Database connection closed');

    } catch (error) {
        t.fail(`Error during database test: ${error.message}`);
    } finally {
        if (client) {
            try {
                await client.end();
                console.log('Database connection closed');
            } catch (error) {
                console.error('Error closing database connection:', error.message);
            }
        }
        // End the test
        t.end();
        process.exit(0); // Ensure the process exits after the test completes
    }
});


tape.skip('Demo Test with Console Logs', async (t) => {
    t.plan(3); // Adjusted to match the number of steps

    console.log('Starting the test...');

    try {
        console.log('Connecting to the database...');
        // Simulate connecting to the database
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Connected to the database');

        console.log('Executing a database query...');
        // Simulate executing a database query
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Database query executed successfully');
        t.pass('Database query executed successfully');

        console.log('Performing an assertion...');
        // Simulate performing an assertion
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Assertion passed');
        t.pass('Assertion passed');

        console.log('Cleaning up resources...');
        // Simulate cleaning up resources
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Resources cleaned up');
        t.pass('Resources cleaned up');

        console.log('Ending the test...');
    } catch (error) {
        console.error('Error during test:', error.message);
        t.fail(`Error during test: ${error.message}`);
    } finally {
        console.log('Finalizing the test...');
        t.end();
        console.log('Test ended');
        process.exit(0); // Ensure the process exits after the test completes
    }
});


tape.skip('Test Create Car and Delete Car', async (t) => {
    t.plan(6); // Adjust the number based on how many assertions you are making

    let client;
    try {
        // Connect to database
        client = await connectToDatabase();
        t.pass('Connected to PostgreSQL database');

        // Ensure the Cars table exists or create it (if not already created)
        await client.query(createPartnerCarsTableQuery);
        t.pass('Cars table exists or created successfully');

        // Example Insert Query to Add a Car with a photo (simulated as a base64-encoded string)
        const carPhotoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAhSURBVBhXY/j//z8ABf4C/qc1gY4AAAAASUVORK5CYII='; // Example base64 image
        const insertCarQuery = `
            INSERT INTO Cars (
                car_make, car_model, car_color, car_year, car_vin,
                car_license_plate, car_options, car_photo, rate, meta_info
            ) VALUES (
                'Toyota',
                'Camry',
                'Red',
                2020,
                'ABC12345678901234',
                'ABC123',
                'Child seat available',
                decode('${carPhotoBase64}', 'base64'),
                4,
                'Some additional info'
            )
            RETURNING id, car_make, car_model
        `;

        const insertResult = await client.query(insertCarQuery);
        t.equal(insertResult.rows.length, 1, 'Car inserted successfully');
        t.equal(insertResult.rows[0].car_make, 'Toyota', 'Car make matches');
        t.equal(insertResult.rows[0].car_model, 'Camry', 'Car model matches');

        // Clean up (delete the car)
        await client.query('DELETE FROM Cars WHERE car_vin = $1', ['ABC12345678901234']);
        t.pass('Car deleted successfully');

    } catch (error) {
        t.fail(`Error during database test: ${error.message}`);
    } finally {
        // Close database connection
        if (client) {
            try {
                await client.end();
                console.log('Database connection closed');
            } catch (error) {
                console.error('Error closing database connection:', error.message);
            }
        }

        t.end(); // End the test
        process.exit(0); // Ensure the process exits after the test completes
    }
});

tape('Test Create Bank Table and Delete Row', async (t) => {
    t.plan(5); // Adjust the number based on how many assertions you are making
  
    let client;
    try {
      // Connect to the database
      client = await connectToDatabase();
      t.pass('Connected to PostgreSQL database');
  
      // Create the Bank table
      await client.query(createBankTableQuery);
      t.pass('Bank table created successfully');
  
      // Insert a test row
      const insertBankQuery = `
        INSERT INTO Bank (
          bank_type, bank_name, bank_account_clear_number, bank_account_number,
          bank_address, bank_phone_number, bank_email, user_card_name,
          user_card_number, user_card_valid, user_card_cvc, meta_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, bank_name
      `;
      const insertValues = [
        'card',
        'Test Bank',
        '12345',
        '67890',
        '123 Test St, Test City',
        '1234567890',
        'test.bank@example.com',
        'John Doe',
        '1234567890123456',
        '2025-12-31',
        '123',
        'Some additional info'
      ];
      const insertResult = await client.query(insertBankQuery, insertValues);
      const bankId = insertResult.rows[0].id;
      t.ok(bankId, 'Bank row inserted successfully');
  
      // Retrieve the inserted row
      const selectBankQuery = 'SELECT * FROM Bank WHERE id = $1';
      const selectResult = await client.query(selectBankQuery, [bankId]);
      t.equal(selectResult.rows.length, 1, 'Bank row retrieved successfully');
  
      // Delete the inserted row
      await client.query('DELETE FROM Bank WHERE id = $1', [bankId]);
      t.pass('Bank row deleted successfully');
  
    } catch (error) {
      t.fail(`Error during database test: ${error.message}`);
    } finally {
      // Close the database connection
      if (client) {
        try {
          await client.end();
          console.log('Database connection closed');
        } catch (error) {
          console.error('Error closing database connection:', error.message);
        }
      }
      t.end(); // End the test
      process.exit(0); // Ensure the process exits after the test completes
    }
  });
  