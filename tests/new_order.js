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

const currentOrderId = []

test('Create New Order then Notify all Drivers', async function createOrderDriverNotification(t) {
  const client = await pool.connect();
  
  const order = {
    // id: 1, // auto generate by DB
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
    const driver = await pool.connect();  // Connect to the pool
    
    // Set up a listener for the 'new_notification' channel
    driver.query('LISTEN new_notification');

    // Listen for notifications and fetch new data
    const notificationPromise = new Promise(resolve => {
      driver.on('notification', async msg => {
        try {
          // Handle the notification payload here
          if (msg.channel === 'new_notification') {
            // console.log('Setting notification:', msg.payload);
            const notification = msg.payload;
            t.pass(`Get new notification: ${notification}`);
            const orderId = result.rows[0].id
            currentOrderId.id = orderId
            const insertedOrder = await fetchOrderById(client, orderId); // remove if don't need it
            t.pass('Driver got notifactions')
            resolve();  // Resolve the promise when the async operations are done
            driver.release();
          }
        } catch (error) {
          console.error('Error in notification event handler:', error);
        }
      });
    });

    // Perform the actual database insertion
    const result = await createNewOrder(client, order);

    await Promise.race([notificationPromise]);
  
    // Retrieve the inserted order for verification
    const insertedOrder = await fetchOrderById(client, result.rows[0].id);
    
    // Verify the order was inserted correctly
    t.equal(insertedOrder.id, result.rows[0].id, 'Order ID matches');    
  } catch (error) {
    console.error('Test failed with an error:', error);
  } finally {
    // Cleanup after the test
    client.release();
  }

  async function createNewOrder(client, order) {
    const insertQuery = generateInsertQuery(order);
    // console.log('Generated Insert Query:', insertQuery);
    t.pass('New Order have been created')
    const result = await client.query(insertQuery);
    // Notify listeners about the new order
    await client.query("NOTIFY new_notification, 'New notification added'");
    t.pass('DB is listening of new notification')
    return result;    
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
    return result.rows[0];
  }
});

test('Notify all drivers', async function notifyDrivers(t) {
  async function getOrders () {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM orders WHERE driver_id IS null');
    
    // Map the rows to a more user-friendly format
    const orders = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      driverTelNumber: row.driver_tel_number,
      userName: row.user_name,
      userTelNumber: row.user_tel_number,
      pickupStreet: row.pickup_street,
      pickupZip: row.pickup_zip,
      pickupCity: row.pickup_city,
      pickupTime: row.pickup_time,
      pickupDate: row.pickup_date,
      destinationStreet: row.destination_street,
      destinationZip: row.destination_zip,
      destinationCity: row.destination_city,
      carNumber: row.car_number,
      carColor: row.car_color,
      carModel: row.car_model,
      price: parseFloat(row.price),  // Convert to float if needed
      paid: row.paid,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      orderStatus: row.order_status,
      metaInfo: row.meta_info,
    }));
    
    // This is ID of orderder which was created new (at 1st test)
    const id = currentOrderId.id;
    
    // Find last created order (from previeus test) from orders list which have not driver_id yet
    const mappedOrder = orders.find(order => order.id === id);
    t.equal(mappedOrder.id, id, 'Get order from DB by last created order ID');

    if (mappedOrder.id === id) {
      console.log('--------')
    };
       
    // const removeOrder = await client.query('DELETE FROM orders WHERE id = $1', [mappedOrder.id]);

    // TODO: Build query to send notification to all drivers about the new order by orderId
    t.pass('Drivers was notifyed');

    // If driver accept order which have currentOrderId.id so update mappedOrder and send to DB
    if (mappedOrder) {
      const driver = await getDriver(1); // change this value to driverID which was accepted order
      mappedOrder.driverId = driver.id;
      mappedOrder.driverName = driver.driver_name;
      mappedOrder.driverTelNumber = driver.driver_tel_number;

      // Update the order in the database
      await updateOrder(mappedOrder);
    }

    async function getDriver (id) {
      const result = await client.query(`SELECT * FROM drivers WHERE id = $1`, [id]);
      return result.rows[0]
    }
      
    async function updateOrder(order) {
      const updateQuery = generateUpdateQuery(order);
      const result = await client.query(updateQuery);
      return result.rows[0]; // Returning the updated order
    }

    function generateUpdateQuery(order) {
      const formattedDate = order.pickupDate.toISOString().split('T')[0]; // Format Date to 'YYYY-MM-DD'
    
      const updateValues = Object.entries(order)
        .filter(([key, value]) => key !== 'id' && value !== undefined && value !== null)
        .map(([key, value]) => {
          // Convert camelCase to snake_case
          const snakeCaseKey = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    
          if (key === 'pickupDate') {
            return `${snakeCaseKey} = '${formattedDate}'`;
          } else if (typeof value === 'string') {
            return `${snakeCaseKey} = '${value}'`;
          } else {
            return `${snakeCaseKey} = ${value}`;
          }
        })
        .join(', ');
    
      return `UPDATE orders SET ${updateValues} WHERE id = ${order.id} RETURNING id, driver_id, user_id, driver_name, driver_tel_number, user_name, user_tel_number, pickup_street, pickup_zip, pickup_city, pickup_time, pickup_date, destination_street, destination_zip, destination_city, car_number, car_color, car_model, price, paid, payment_status, payment_method, order_status, meta_info;`;
    }
    t.pass(`Order which has ID:${id} have been updated, now it have driver ${mappedOrder.driverName}`)
    
    client.release();
    return orders
  }
  await getOrders ()
});


//---------TEST (how to pass the props between two tests) -------
// Initialize a context object
const context = {};

test.skip('1st test', async function testOne(t) {
  const x = '10000000000000000';
  context.x = x; // Store the value in the context object
});

test.skip('2nd test', async function testTwo(t) {
  // orders = [];
  // const order = await client.query('SELECT * FROM orders WHERE driver_id IS null');
  
  // const orders = [order.rows];
  // console.log(orders);

  const x = context.x; // Retrieve the value from the context object

  console.log(x); // This should print '10000000000000000'
});
//--------- END -------

// Verify the order was inserted correctly
test('Test Inserted Order', t => {
  t.pass('END of TEST');
  // t.equal(insertedOrder.driver_name, order.driver_name, 'Driver name matches');
  t.end();
  });