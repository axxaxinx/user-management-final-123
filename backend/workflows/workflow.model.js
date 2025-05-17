const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Workflow = sequelize.define('Workflow', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('Onboarding', 'DepartmentChange', 'Termination'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      allowNull: false,
      defaultValue: 'Pending'
    },
    details: {
      type: DataTypes.TEXT, //change to STRING
      allowNull: true
    }
  }, {
    timestamps: true
  });

  Workflow.associate = (models) => {
    Workflow.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
  };

  return Workflow;
};