const { DataTypes } = require("sequelize");
const sequelize = require("../database/index");
const { Status } = require("./../utils/constant");

const Report = sequelize.define("Report", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classification: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  modelType: {
    type: DataTypes.STRING, // To specify if it's a Question or Response
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: Status.PENDING_REVIEW,
  },
});

module.exports = Report;
