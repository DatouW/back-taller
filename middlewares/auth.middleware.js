const jwt = require("jsonwebtoken");
const { promisify } = require("util");
require("dotenv").config();
const { User } = require("../models");

// Función de middleware para validar el token
exports.verifyToken = async (req, res, next) => {
  // Obtener el token del encabezado de autorización
  const token = req.headers["authorization"];

  // Verificar si el token está presente
  if (!token) {
    return res
      .status(401)
      .json({ message: "Token de autorización no proporcionado" });
  }

  try {
    // Verificar la validez del token usando promesas
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // Si el token es válido, extraer el tiempo de expiración
    const expirationTime = decoded.exp;

    // Comparar el tiempo de expiración con el tiempo actual
    const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    if (currentTime > expirationTime) {
      return res
        .status(401)
        .json({ message: "Token de autorización expirado" });
    } else {
      // Si el token es válido y no ha expirado, asignar el objeto decodificado a req.user
      const user = await User.findByPk(decoded.id);
      if (user) {
        req.user = user;
        next();
      } else {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
    }
  } catch (error) {
    // Manejar cualquier error de verificación del token
    return res.status(401).json({ message: "Token de autorización inválido" });
  }
};
