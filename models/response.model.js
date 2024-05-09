// response.js

const { DataTypes } = require("sequelize");
const sequelize = require("./../database/index");

const Response = sequelize.define("Response", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = Response;
