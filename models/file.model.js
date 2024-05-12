const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const File = sequelize.define("File", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = File;
