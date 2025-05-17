const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'OnLeave', 'Terminated'),
      allowNull: false,
      defaultValue: 'Active'
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reportingTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Employees',
        key: 'id'
      }
    }
  }, {
    timestamps: true
  });

  Employee.associate = (models) => {
    Employee.belongsTo(models.Account, { foreignKey: 'userId', as: 'user' });
    Employee.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Employee.hasMany(models.Workflow, { foreignKey: 'employeeId', as: 'workflows' });
    Employee.hasMany(models.Request, { foreignKey: 'employeeId', as: 'requests' });
    Employee.belongsTo(Employee, { foreignKey: 'reportingTo', as: 'manager' });
    Employee.hasMany(Employee, { foreignKey: 'reportingTo', as: 'subordinates' });
  };

  return Employee;
};