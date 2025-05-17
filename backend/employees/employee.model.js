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
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active'
    }
  }, {
    timestamps: true
  });

  Employee.associate = (models) => {
    Employee.belongsTo(models.Account, { foreignKey: 'userId', as: 'user' });
    Employee.belongsTo(models.Department, { foreignKey: 'departmentId', as: 'department' });
    Employee.hasMany(models.Workflow, { foreignKey: 'employeeId', as: 'workflows' });
  };

  return Employee;
};