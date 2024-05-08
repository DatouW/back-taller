const jwt = require("jsonwebtoken");
require("dotenv").config();

// Función de middleware para validar el token
exports.verifyToken = (req, res, next) => {
  // Obtener el token del encabezado de autorización
  const token = req.headers["authorization"];

  // Verificar si el token está presente
  if (!token) {
    return res
      .status(401)
      .json({ message: "Token de autorización no proporcionado" });
  }

  try {
    // Llamar a next() para pasar al siguiente middleware o ruta
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token de autorización inválido" });
  }
};
