const { DataTypes } = require("sequelize");
const sequelize = require("./../database/index");
const { Status } = require("./../utils/constant");

const Question = sequelize.define("Question", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: Status.SUBMITTED,
  },
});

module.exports = Question;
