const config = require('config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// It's good practice to parse numbers and provide defaults
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

module.exports = db = {};

initialize();

async function initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database } = config.database;
    
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    // connect to db
    // const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });
    const sequelize = new Sequelize(
        database,
        user,
        password,
        {
           host: host,
           dialect: 'mysql'
        }
       );

    // init models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Employee = require('../employees/employee.model')(sequelize);
    db.Department = require('../departments/department.model')(sequelize);
    db.Workflow = require('../workflows/workflow.model')(sequelize);

    // define relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    // Define Account <-> Employee Relationship (One-to-One)
    // If an Account is deleted, set the employee's accountId to NULL.
    db.Account.hasOne(db.Employee, { foreignKey: 'userId', as: 'employee' });
    db.Employee.belongsTo(db.Account, { foreignKey: 'userId', as: 'user' });
    db.Department.hasMany(db.Employee, { foreignKey: 'departmentId', as: 'employees' });
    db.Employee.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
    db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId', as: 'workflows' });
    db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId', as: 'employee' });

    // sync all models with database
    await sequelize.sync({ alter: false });
}
