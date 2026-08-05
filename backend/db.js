const { Sequelize } = require('sequelize');
const path = require('path');

require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Use Production PostgreSQL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
} else {
  // Fallback to SQLite Development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
