const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const MenuItem = sequelize.define('MenuItem', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false }
});

module.exports = MenuItem;
