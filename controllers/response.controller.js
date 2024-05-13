const { Response, Question, Resource, User, File } = require("../models");
const AppError = require("./../utils/appError");


exports.createResponse = async (req, res) => {
  try {
    const { description, questionId, userId, url_extern } = req.body;
    const newResponse = await Response.create({
      description,
      QuestionId: questionId,
      UserId: userId,
      url_extern
    });
    return res.json(newResponse);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.getResponse = async (req, res, next) => {
  const { id } = req.params;
  try {
    let response = await Response.findByPk(id, {
      include: 'resources'
    });
    if (response) {
      const { resources, ...dataRes } = response.toJSON()
      let resData = []
      for (let res of resources) {
        const resSearch = await Resource.findByPk(res.id, {
          include: [
            {
              model: File,
              attributes: ["id", "filename", "path_url"],
            },
            {
              model: User,
              attributes: ["id", "name"],
            },
          ],
        })
        resData.push(resSearch)
      }
      const resp={
        ...dataRes,
        resources:resData
      }
      return res.json(resp);
    } else {
      return next(new AppError("Respuesta no encontrada!", 404));
    }
  } catch (error) {
    console.log({ error })
    res.status(500).json({ error: "Error al obtener la respuesta" });
  }
};

exports.updateResponse = async (req, res, next) => {
  const { id } = req.params;
  const { description } = req.body;
  try {
    const [updatedCount] = await Response.update(
      { description },
      { where: { id } }
    );
    if (updatedCount) {
      return res.json({ message: "Respuesta actualizada correctamente" });
    } else {
      return next(new AppError("Respuesta no encontrada!", 404));
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la respuesta" });
  }
};

exports.deleteResponse = async (req, res, next) => {
  const { id } = req.params;
  try {
    const deletedResponseCount = await Response.destroy({ where: { id } });
    if (deletedResponseCount) {
      return res.json({ message: "Respuesta eliminada correctamente" });
    } else {
      return next(new AppError("Respuesta no encontrada!", 404));
    }
  } catch (error) {
    return res.status(500).json({ error: "Error al eliminar la respuesta" });
  }
};
