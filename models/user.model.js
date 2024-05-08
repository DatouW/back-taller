// user.js

const { DataTypes } = require("sequelize");
const sequelize = require("../database/index");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // Validación para asegurar que el email tenga el formato correcto
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isNumeric: true, // Asegurar que sea un número
      isLongEnough(value) {
        if (value !== null && value.toString().length < 7) {
          throw new Error(
            "El número de teléfono debe tener al menos 7 dígitos."
          );
        }
      },
    },
  },
  photo_url: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = User;
