const sequelize = require("./database/index");
const app = require("./app");

require("./models");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate(); // Verificar conexión a la base de datos
    console.log("Conexión establecida correctamente.");

    // Sincronizar modelos con la base de datos
    await sequelize.sync();

    console.log("Modelos sincronizados correctamente con la base de datos.");

    console.log(`Servidor corriendo en el puerto ${PORT}`);
  } catch (error) {
    console.error("Error al arrancar el servidor:", error);
  }
});
