// response.js

const { DataTypes } = require("sequelize");
const sequelize = require("./../database/index");
const Resource = require("./resource.model");

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
  url_extern: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

Response.hasMany(Resource, { as: "resources" });

module.exports = Response;
