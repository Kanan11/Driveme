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

async function createNewOrder(client, order) {
  const columns = Object.keys(order).join(', ');
  const values = Object.values(order).map(value => typeof value === 'string' ? `'${value}'` : value).join(', ');

  const insertQuery = `
    INSERT INTO orders (${columns}) VALUES (${values});
  `;

  console.log('Generated Insert Query:', insertQuery);

  try {
    await client.query('BEGIN');
    await client.query(insertQuery);
    await client.query('COMMIT');
    console.log('New order inserted successfully.');
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

    const order = {
        id: 11,
        driver_id: null,
        user_id: null,
        driver_name:'Ivan',
        driver_tel_number: 'Smirnov',
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
        payment_method: 'Swish',
        meta_info: 'TEXT',
        order_status: 'Processing',
        payment_status: false,
        meta_info: 'More details'
    };

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
    pool.end();
  }
}

test('Test Orders Table Connection', t => {
  t.plan(1); // Set the number of assertions to expect

  testOrdersTableConnection().then(() => {
    t.pass('Orders table connection test passed');
  }).catch(error => {
    t.fail(`Orders table connection test failed with error: ${error.message}`);
  });
});



test('Driver subscribes and is notified on new order', async t => {
    let driver, user, notification;
    const orders = [];

    try {
        // Connect driver and user
        driver = connectDriver({
            user: dbUser,
            host: host,
            database: dbName,
            password: dbPassword,
            port: port,
        });
        user = connectUser({
            user: dbUser,
            host: host,
            database: dbName,
            password: dbPassword,
            port: port,
        });

        // Setup driver to listen for new_order notifications
        driver.query('LISTEN new_order');
        driver.on('notification', async msg => {
            if (msg.channel === 'new_order') notification = msg.payload;
            orders.push(...await fetchOpenOrders());
            t.pass('Driver got notifications');
        });

        t.equal(orders.length, 0);

        // As a user, create an order
        await createOrder(user, { location: '' });

        t.equal(orders.length, 1);
        t.ok(notification, 'Notification payload is set');
    } catch (error) {
        console.error('Error in test:', error);
        t.fail('Test failed with an error');
    } finally {
        // Clean up or close connections if needed
        // Example: driver.end(); user.end();
        t.end(); // End the test
    }
});
