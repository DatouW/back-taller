const { DataTypes } = require("sequelize");
const sequelize = require("../database/index");
const Like = require("./like.model");

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

// Calcular el puntaje de la respuesta
Response.prototype.calculateScore = async function () {
  const likes = await Like.count({
    where: { ResponseId: this.id, is_liked: true },
  });
  const unlikes = await Like.count({
    where: { ResponseId: this.id, is_liked: false },
  });
  return likes - unlikes;
};

module.exports = Response;
