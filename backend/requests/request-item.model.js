const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RequestItem = sequelize.define('RequestItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Requests',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  }, {
    timestamps: true
  });

  RequestItem.associate = (models) => {
    RequestItem.belongsTo(models.Request, { foreignKey: 'requestId', as: 'request' });
  };

  return RequestItem;
};