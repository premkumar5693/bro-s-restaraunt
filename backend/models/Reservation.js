const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Reservation = sequelize.define('Reservation', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false },
  guests: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' }
});

module.exports = Reservation;
