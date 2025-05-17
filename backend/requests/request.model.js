const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Request = sequelize.define('Request', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('Equipment', 'Leave', 'Resources'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Employees',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  }, {
    timestamps: true
  });

  Request.associate = (models) => {
    Request.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    Request.hasMany(models.RequestItem, { foreignKey: 'requestId', as: 'items', onDelete: 'CASCADE' });
  };

  return Request;
};