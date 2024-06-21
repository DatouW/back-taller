const { Report, Question, Response } = require("../models");
const { Status, PUBLICAR_PREGUNTA } = require("../utils/constant");
const { assignPoints } = require("../utils/pointUtil");

exports.getAllReports = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  // Convert page and pageSize to integers and ensure they are valid
  const pageInt = parseInt(page, 10);
  const pageSizeInt = parseInt(pageSize, 10);
  const offset = (pageInt - 1) * pageSizeInt;
  const limit = pageSizeInt;

  try {
    const { count, rows } = await Report.findAndCountAll({
      offset,
      limit,
      order: [["createdAt", "DESC"]], // Optional: Sort by creation date, most recent first
    });

    const totalPages = Math.ceil(count / pageSizeInt);

    return res.json({
      totalItems: count,
      totalPages,
      currentPage: pageInt,
      pageSize: pageSizeInt,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al obtener reportes" });
  }
};

exports.getReportWithDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const report = await Report.findByPk(id, {
      include: [
        {
          model: Question,
          attributes: ["id", "title", "content"],
        },
        {
          model: Response,
          attributes: ["id", "description"],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({ mensaje: "Reporte no encontrado" });
    }

    return res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Hubo un error al buscar el reporte" });
  }
};

exports.handleReport = async (req, res) => {
  const { id } = req.params;
  const { isApproved } = req.body; // Cambiar de req.params a req.body para manejar mejor el booleano

  try {
    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({ mensaje: "Reporte no encontrado" });
    }

    if (isApproved) {
      if (report.QuestionId) {
        const question = await Question.findByPk(report.QuestionId);
        // Asignar puntos si la pregunta es nueva
        if (question.status === Status.PENDING_REVIEW_F) {
          await assignPoints(question.UserId, PUBLICAR_PREGUNTA, -3);
        }
        await question.update({ status: Status.APPROVED });
      } else if (report.ResponseId) {
        const response = await Response.findByPk(report.ResponseId);
        // Asignar puntos si la pregunta es nueva
        if (response.status === Status.PENDING_REVIEW_F) {
          await assignPoints(response.UserId, PUBLICAR_PREGUNTA, 5);
        }
        await response.update({ status: Status.APPROVED });
      }
    } else {
      if (report.QuestionId) {
        await Question.update(
          { status: Status.REJECTED },
          { where: { id: report.QuestionId } }
        );
      } else if (report.ResponseId) {
        await Response.update(
          { status: Status.REJECTED },
          { where: { id: report.ResponseId } }
        );
      }
    }

    await report.update({ status: Status.PROCESSED });

    return res.json({ mensaje: "Reporte procesado correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al procesar el reporte" });
  }
};
