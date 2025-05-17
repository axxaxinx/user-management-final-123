// db.js - Modified with enhanced error handling and debugging
let config;

try {
    // Attempt to load config using absolute path
    config = require(process.cwd() + '/config');
    console.log('Config loaded successfully using absolute path');
} catch (error) {
    console.error('Error loading config with absolute path:', error.message);
    
    try {
        // Fallback to relative path
        config = require('../config');
        console.log('Config loaded successfully using relative path');
    } catch (error) {
        console.error('Error loading config with relative path:', error.message);
        
        // Provide a hardcoded fallback configuration
        console.log('Using hardcoded fallback configuration');
        config = {
            database: {
                host: "153.92.15.31",
                port: 3306,
                user: "u875409848_lape",
                password: "9T2Z5$3UKkgSYzE",
                database: "u875409848_lape"
            }
        };
    }
}

// Print config object for debugging
console.log('Config object:', JSON.stringify({
    'database.host': config.database?.host,
    'database.port': config.database?.port,
    'database.user': config.database?.user,
    'database.database': config.database?.database
}, null, 2));

const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        // Use destructuring with fallbacks to prevent errors if properties are missing
        const { 
            host = "153.92.15.31", 
            port = 3306, 
            user = "u875409848_laki", 
            password = "9T2Z5$3UKkgSYzE", 
            database = "u875409848_laki" 
        } = config.database || {};
        
        console.log('Using database configuration:');
        console.log(`Host: ${host}, Port: ${port}, User: ${user}, Database: ${database}`);
        
        // Ensure essential DB config is present
        if (!host || !port || !user || !database) {
            console.error("FATAL ERROR: Missing database configuration in environment variables or config/index.js.");
            console.error("Host:", host, "Port:", port, "User:", user, "Database:", database);
            process.exit(1);
        }

        // Create db if it doesn't already exist
        console.log('Creating connection to MySQL server...');
        const connection = await mysql.createConnection({ host, port, user, password });
        console.log('Connected to MySQL server successfully');
        
        console.log(`Creating database ${database} if it doesn't exist...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        console.log('Database creation query executed');
        
        await connection.end();
        console.log('Initial connection closed');

        // Connect to db using config values
        console.log('Connecting to database with Sequelize...');
        const sequelize = new Sequelize(
            database,
            user,
            password,
            {
               host: host,
               port: port,
               dialect: 'mysql',
               logging: console.log // Enable logging temporarily for debugging
            }
        );
        
        console.log('Sequelize connection established');

        // Init models
        console.log('Initializing models...');
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        db.Employee = require('../employees/employee.model')(sequelize);
        db.Department = require('../departments/department.model')(sequelize);
        db.Workflow = require('../workflows/workflow.model')(sequelize);
        db.Request = require('../requests/request.model')(sequelize);
        db.RequestItem = require('../requests/request-item.model')(sequelize);
        console.log('Models initialized');

        // Define relationships
        console.log('Setting up relationships...');
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
        console.log('Relationships established');

        db.sequelize = sequelize;

        // Sync models with database
        console.log('Syncing models with database...');
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Fatal error during database initialization:');
        console.error(error);
        process.exit(1);
    }
}