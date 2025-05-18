// db.js - Modified with enhanced error handling and debugging
const config = require('../config');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    let retries = 5;
    while (retries > 0) {
        try {
            console.log(`Attempting database connection (${retries} retries left)...`);
            
            // Create db if it doesn't already exist
            const connection = await mysql.createConnection({
                host: config.database.host,
                port: config.database.port,
                user: config.database.user,
                password: config.database.password,
                connectTimeout: 10000 // 10 seconds timeout
            });

            console.log('Connected to MySQL server, creating database if not exists...');
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.database}\`;`);
            await connection.end();

            // Connect to db with enhanced settings
            const sequelize = new Sequelize(
                config.database.database,
                config.database.user,
                config.database.password,
                {
                    host: config.database.host,
                    port: config.database.port,
                    dialect: 'mysql',
                    logging: console.log,
                    pool: {
                        max: 5,
                        min: 0,
                        acquire: 60000,  // Increased timeout
                        idle: 10000
                    },
                    retry: {
                        max: 3
                    },
                    dialectOptions: {
                        connectTimeout: 60000
                    }
                }
            );

            // Test the connection
            await sequelize.authenticate();
            console.log('Connection to database has been established successfully.');

            console.log('Initializing models...');
            // Init models and add them to the exported db object
            db.Account = require('../accounts/account.model')(sequelize);
            db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
            db.Employee = require('../employees/employee.model')(sequelize);
            db.Department = require('../departments/department.model')(sequelize);
            db.Workflow = require('../workflows/workflow.model')(sequelize);
            db.Request = require('../requests/request.model')(sequelize);
            db.RequestItem = require('../requests/request-item.model')(sequelize);

            console.log('Setting up model relationships...');
            // Define relationships
            db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
            db.RefreshToken.belongsTo(db.Account);

            db.Account.hasOne(db.Employee, { foreignKey: 'userId', as: 'employee' });
            db.Employee.belongsTo(db.Account, { foreignKey: 'userId', as: 'user' });

            db.Department.hasMany(db.Employee, { foreignKey: 'departmentId', as: 'employees' });
            db.Employee.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });

            db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId', as: 'workflows' });
            db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId', as: 'employee' });
            
            db.Employee.hasMany(db.Request, { foreignKey: 'employeeId', as: 'requests' });
            db.Request.belongsTo(db.Employee, { foreignKey: 'employeeId', as: 'employee' });
            
            db.Request.hasMany(db.RequestItem, { foreignKey: 'requestId', as: 'items', onDelete: 'CASCADE' });
            db.RequestItem.belongsTo(db.Request, { foreignKey: 'requestId', as: 'request' });

            console.log('Syncing database...');
            try {
                // First try a normal sync
                await sequelize.sync();
                console.log('Database sync completed successfully!');
            } catch (syncError) {
                console.log('Initial sync failed, attempting with foreign key checks disabled...', syncError);
                try {
                    // Disable foreign key checks, drop tables in correct order, then re-enable checks
                    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
                    
                    // Drop tables in reverse order of dependencies
                    await sequelize.query('DROP TABLE IF EXISTS `RequestItems`;');
                    await sequelize.query('DROP TABLE IF EXISTS `Requests`;');
                    await sequelize.query('DROP TABLE IF EXISTS `Workflows`;');
                    await sequelize.query('DROP TABLE IF EXISTS `Employees`;');
                    await sequelize.query('DROP TABLE IF EXISTS `Departments`;');
                    await sequelize.query('DROP TABLE IF EXISTS `RefreshTokens`;');
                    await sequelize.query('DROP TABLE IF EXISTS `Accounts`;');
                    
                    // Re-enable foreign key checks
                    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
                    
                    // Now create all tables
                    await sequelize.sync({ force: true });
                    console.log('Force sync completed successfully!');
                } catch (forceError) {
                    console.error('Force sync failed:', forceError);
                    // Re-enable foreign key checks in case of error
                    try {
                        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
                    } catch (error) {
                        console.error('Error re-enabling foreign key checks:', error);
                    }
                    throw forceError;
                }
            }

            console.log('Database initialization completed successfully!');
            return; // Exit the retry loop on success
        } catch (error) {
            console.error(`Database connection attempt failed (${retries} retries left):`, error.message);
            if (error.parent) {
                console.error('Original error:', error.parent);
            }
            retries--;
            if (retries === 0) {
                console.error('All database connection attempts failed');
                throw error;
            }
            // Wait for 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}