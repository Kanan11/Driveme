const test = require('tape');
const { Pool } = require('pg');
require('dotenv').config();

const dbUser = process.env.DB_USER;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;
const dbPassword = process.env.DB_PASSWORD;
const port = process.env.DB_PORT;

const pool = new Pool({
  user: dbUser,
  host: host,
  database: dbName,
  password: dbPassword,
  port: port,
});

test.only('Create New Order then Notify all Drivers', async function createOrderDriverNotification(t) {
  const client = await pool.connect();

  const order = {
    // id: generateRandomId(),
    user_id: 2,
    driver_id: null,
    // driver_name: 'Ivan',
    // driver_tel_number: 'Smirnov',
    user_name: 'Carl',
    user_tel_number: '0707070707',
    pickup_street: 'Vasagatan 5',
    pickup_zip: '415555',
    pickup_city: 'Göteborg',
    pickup_time: '15:30:00',
    pickup_date: '2023-12-26',
    destination_street: '789 Pine St',
    destination_zip: '87654',
    destination_city: 'Cityburg',
    car_number: 'XYZ789',
    car_color: 'Red',
    car_model: 'Model Y',
    price: 200.00,
    paid: true,
    payment_status: false,
    payment_method: 'Swish',
    order_status: 'Pending',
    meta_info: 'More details',
  };
  
  try {
    // Perform the actual database insertion
    const result = await createNewOrder(client, order);
    
    
    // Retrieve the inserted order for verification
    const insertedOrder = await fetchOrderById(client, result.rows[0].id);
    
    // Get all Orders which have not Driver_ID yet
    const ordersWithoutDriver = await client.query('SELECT * FROM orders WHERE driver_id IS null');
    
    // Verify the order was inserted correctly
    t.equal(insertedOrder.id, result.rows[0].id, 'Order ID matches');
    
    console.log('Inserted Order ID:', result.rows[0].id);
    
  } catch (error) {
    console.error('Test failed with an error:', error);
  } finally {
    // Cleanup after the test
    await client.release();
  }

  async function createNewOrder(client, order) {
    try {
      const insertQuery = generateInsertQuery(order);
      console.log('Generated Insert Query:', insertQuery);
      
      await client.query('BEGIN');
      const result = await client.query(insertQuery);
      await client.query('COMMIT');
      console.log('New order inserted successfully. Order ID:', result.rows[0].id);
      
      const driver = await pool.connect();
      
      // Assuming `driver` is available in the scope
      if (driver) {
        // Listen for the 'notification' event
        const notificationPromise = new Promise(resolve => {
          console.log('--------------')
          driver.once('notification', async msg => {
            try {
              console.log('Received notification:', msg);
              if (msg.channel === 'new_order' && msg.payload.orderId === result.rows[0].id) {
                console.log('Setting notification:', msg.payload);
                notification = msg.payload;
                await fetchOpenOrders();  // Assuming fetchOpenOrders is asynchronous
                orders.push(...await fetchOpenOrders());
                console.log('Driver got notifications');
                resolve(); // Resolve the promise when the async operations are done
              }
            } catch (error) {
              console.error('Error in notification event handler:', error);
              
            }
          });
        });
        
        // Timeout to handle a scenario where the 'notification' event is not emitted
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
        
        // Wait for either the 'notification' event or timeout
        await Promise.race([notificationPromise, timeoutPromise]);
      }
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error inserting new order:', error);
    }
    
  }
  
  function generateInsertQuery(order) {
    const columns = Object.keys(order).join(', ');
    const values = Object.values(order).map(value => {
      if (value === null) {
        return 'NULL';
      } else if (typeof value === 'string') {
        return `'${value}'`;
      } else {
        return value;
      }
    }).join(', ');
    
    return `INSERT INTO orders (${columns}) VALUES (${values}) RETURNING id, driver_id, user_id, driver_name, driver_tel_number, user_name, user_tel_number, pickup_street, pickup_zip, pickup_city, pickup_time, pickup_date, destination_street, destination_zip, destination_city, car_number, car_color, car_model, price, paid, payment_status, payment_method, order_status, meta_info;`;
  }
  
  async function fetchOrderById(client, orderId) {
    const result = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const driverId = await client.query('SELECT * FROM orders WHERE driver_id IS null');
    return result.rows[0];
  }

});

function generateInsertQuery(order) {
  const columns = Object.keys(order).join(', ');
  const values = Object.values(order).map(value => {
    if (value === null) {
      return 'NULL';
    } else if (typeof value === 'string') {
      return `'${value}'`;
    } else {
      return value;
    }
  }).join(', ');

  return `INSERT INTO orders (${columns}) VALUES (${values}) RETURNING id, driver_id, user_id, driver_name, driver_tel_number, user_name, user_tel_number, pickup_street, pickup_zip, pickup_city, pickup_time, pickup_date, destination_street, destination_zip, destination_city, car_number, car_color, car_model, price, paid, payment_status, payment_method, order_status, meta_info;`;
}


async function createNewOrder(client, order) {
    const insertQuery = generateInsertQuery(order);

    console.log('Generated Insert Query:', insertQuery);

    try {
        await client.query('BEGIN');
        const result = await client.query(insertQuery);
        await client.query('COMMIT');
        console.log('New order inserted successfully. Order ID:', result.rows[0].id);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error inserting new order:', error);
    }
}

async function fetchOrderById(client, orderId) {
    const result = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    return result.rows[0];
}

async function testOrdersTableConnection() {
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT $1::text as message', ['Hello, Orders Table!']);
        console.log('Query Result:', result.rows[0].message);
        const generateRandomId = () => Math.floor(Math.random() * 1000);
        const order = {
          // id: generateRandomId(),
          user_id: 2,
          driver_id: null,
          // driver_name: 'Ivan',
          // driver_tel_number: 'Smirnov',
          user_name: 'Carl',
          user_tel_number: '0707070707',
          pickup_street: 'Vasagatan 5',
          pickup_zip: '415555',
          pickup_city: 'Göteborg',
          pickup_time: '15:30:00',
          pickup_date: '2023-12-26',
          destination_street: '789 Pine St',
          destination_zip: '87654',
          destination_city: 'Cityburg',
          car_number: 'XYZ789',
          car_color: 'Red',
          car_model: 'Model Y',
          price: 200.00,
          paid: true,
          payment_status: false,
          payment_method: 'Swish',
          order_status: 'Pending',
          meta_info: 'More details',
      };

        // Perform the actual database insertion
        await createNewOrder(client, order);

        // Retrieve the inserted order for verification
        const insertedOrder = await fetchOrderById(client, order.id);

        // Verify the order was inserted correctly
        test('Test Inserted Order', t => {
            t.equal(insertedOrder.id, order.id, 'Order ID matches');
            t.equal(insertedOrder.driver_name, order.driver_name, 'Driver name matches');
            // Add more assertions for other properties
            t.end();
        });
    } catch (error) {
        console.error('Error testing orders table connection:', error);
    } finally {
        client.release();
        // pool.end();
    }
};

test('Notify all drivers', async function testNotification(t) {
  const client = await pool.connect();
  let driver, user, notification;
  const order = await client.query('SELECT * FROM orders WHERE driver_id IS null');

  const orders = [order.rows];
  // console.log(orders);
  try {
    // Connect driver and user
    driver = await pool.connect();
    user = await pool.connect();

    // Setup driver to listen for new_order notifications
    driver.query('LISTEN new_order');

    // Using a promise to wait for the event handling to complete
    const notificationPromise = new Promise(resolve => {
      driver.on('notification', async msg => {
        console.log('Received notification:', msg);
        if (msg.channel === 'new_order') {
          console.log('Setting notification:', msg.payload);
          notification = msg.payload;
          await fetchOpenOrders();  // Assuming fetchOpenOrders is asynchronous
          orders.push(...await fetchOpenOrders());
          t.pass('Driver got notifications');
          resolve(); // Resolve the promise when the async operations are done
        }
      });
    });

    // Wait for the event handling to complete before moving on
    await notificationPromise;

    t.equal(orders.length, 0);

    // As a user, create an order
    // await createOrder(user, { location: '' });
    console.log('---------------------------------');

    t.ok(notification, 'Notification payload is set');
  } catch (error) {
    console.error('Error in test:', error);
    t.fail('Test failed with an error');
  } finally {
    // Clean up or close connections if needed
    if (driver) driver.release();
    if (user) user.release();
  }
});



test('Combined Test', async t => {
  t.plan(2); // Set the number of assertions to expect
  try {
    // Run the first test case
    await testOrdersTableConnection();
    t.pass('Orders table connection test passed');
    
    // Run the second test case
    await testNotification(t);
    t.pass('Driver was notified of new coming order');
  } catch (error) {
    t.fail(`Test failed with error: ${error.message}`);
  } finally {
    t.end(); // End the test
  }
});
