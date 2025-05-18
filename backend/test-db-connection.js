const config = require('./config');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        console.log('Database config:', {
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            database: config.database.database
        });

        // First test raw MySQL connection
        console.log('\nTesting MySQL connection...');
        const connection = await mysql.createConnection({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password
        });
        
        console.log('MySQL connection successful!');
        
        // Test if database exists
        const [rows] = await connection.query(`SHOW DATABASES LIKE '${config.database.database}'`);
        if (rows.length > 0) {
            console.log(`Database '${config.database.database}' exists`);
        } else {
            console.log(`Database '${config.database.database}' does not exist`);
        }
        
        await connection.end();

        // Test Sequelize connection
        console.log('\nTesting Sequelize connection...');
        const sequelize = new Sequelize(
            config.database.database,
            config.database.user,
            config.database.password,
            {
                host: config.database.host,
                port: config.database.port,
                dialect: 'mysql',
                logging: false
            }
        );

        await sequelize.authenticate();
        console.log('Sequelize connection successful!');

        // Test if tables exist
        console.log('\nChecking for existing tables...');
        const [tables] = await sequelize.query('SHOW TABLES');
        console.log('Existing tables:', tables.map(table => Object.values(table)[0]));

        await sequelize.close();
        console.log('\nAll connection tests passed successfully!');
    } catch (error) {
        console.error('\nConnection test failed:', error);
        if (error.parent) {
            console.error('Original error:', error.parent);
        }
        process.exit(1);
    }
}

testConnection(); 