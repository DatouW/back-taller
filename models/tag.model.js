// label.js

const { DataTypes } = require("sequelize");
const sequelize = require("./../database/index");

const Tag = sequelize.define("Tag", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue("name", value.toLowerCase()); // Convertir el valor a minúsculas antes de almacenarlo
    },
  },
  description: {
    type: DataTypes.STRING,
  },
});

module.exports = Tag;
