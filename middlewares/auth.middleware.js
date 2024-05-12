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
    // Verificar la validez del token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Token de autorización inválido" });
      } else {
        // Si el token es válido, extraer el tiempo de expiración
        const expirationTime = decoded.exp;

        // Comparar el tiempo de expiración con el tiempo actual
        const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
        if (currentTime > expirationTime) {
          return res
            .status(401)
            .json({ message: "Token de autorización expirado" });
        } else {
          // Si el token es válido y no ha expirado, pasar al siguiente middleware o ruta

          next();
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
