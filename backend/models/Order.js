const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerDetails: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('customerDetails');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('customerDetails', JSON.stringify(value || {}));
    }
  },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  items: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('items');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('items', JSON.stringify(value || []));
    }
  },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' }
});

module.exports = Order;
