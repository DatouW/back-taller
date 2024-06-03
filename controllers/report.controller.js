const { Report } = require("../models");

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll();
    return res.json(reports);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al obtener reportes" });
  }
};
