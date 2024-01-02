# This is Back-end of DriveMeHome project should use on app for Android & iOs

# To install PostgreSQL
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get -y install postgresql

or
apt-get install postgresql-12

# Install Node.js PostgreSQL Library:
npm install pg

# Install express
npm install express

# to change password on DB
sudo passwd postgres

# and add this password to default file
nano ~/.pgpass

# add this line and replace password
localhost:5432:driveme:admin:max

# edit DB
sudo nano /etc/postgresql/14/main/pg_hba.conf

sudo service postgresql restart


sudo -u postgres psql

postgres=# CREATE USER admin WITH PASSWORD 'max';
CREATE ROLE
postgres=# CREATE DATABASE driveme;
CREATE DATABASE
postgres=# GRANT ALL PRIVILEGES ON DATABASE driveme TO admin;
GRANT

# to run DB on console
psql -U admin -h 127.0.0.1 -d driveme

\dt

# Export (Create) backup
pg_dump -U admin -h localhost -d driveme -Fc -f driveme_backup.dump

# Import (Restore) Database
pg_restore -U admin -h localhost -d driveme -Fc -j 4 -v driveme_backup.dump


server/
|-- app.js          // Entry point of the Node.js application
|-- node_modules/   // Node.js modules installed via npm
|-- package.json    // Project metadata and dependencies
|-- db.js           // Database connection and initialization logic
|-- routes/         // Route handlers
|   |-- index.js    // Main route handler
|-- models/         // Database models
|   |-- user.js     // User model, for example
|-- views/          // Views if you're using a template engine
|-- public/         // Static assets (HTML, CSS, images, etc.)
|-- src/            // React source code
|   |-- components/ // React components
|   |-- App.js      // Main React component
|   |-- index.js    // Entry point for the React app
|-- config/         // Configuration files
|-- tests/          // Tests if you're using a testing framework
|-- .gitignore      // Specifies files and directories to be ignored by Git


client/
|-- android/         // Android-specific files and configurations
|-- ios/             // iOS-specific files and configurations
|-- node_modules/    // Node.js modules installed via npm (used by React Native)
|-- src/             // Source code for your React Native app
|   |-- components/  // React Native components
|   |-- screens/     // Screen components
|   |-- App.js       // Entry point for your React Native app
|-- index.js         // Entry point for the whole React Native app
|-- package.json     // Project metadata and dependencies
|-- .gitignore       // Specifies files and directories to be ignored by Git
|-- ...other files


ALTER TABLE public.orders ADD driver_id int NULL;






