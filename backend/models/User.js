const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'customer' },
  resetToken: { type: DataTypes.STRING, allowNull: true },
  resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
  addresses: {
    type: DataTypes.TEXT, 
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('addresses');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('addresses', JSON.stringify(value));
    }
  }
});

module.exports = User;
