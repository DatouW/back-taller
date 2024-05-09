const { Tag, Question, User } = require("../models");
const sequelize = require("./../database/index");

const AppError = require("./../utils/appError");

exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.findAll();
    return res.json(tags);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al obtener los tags" });
  }
};

exports.getQuestionsByTag = async (req, res) => {
  const { id } = req.params;
  try {
    const tag = await Tag.findByPk(id);
    if (tag) {
      const questions = await tag.getQuestions({
        include: [
          {
            model: Tag, // Incluir el modelo de Tag
            attributes: ["id", "name"], // No incluir atributos de Tag en la respuesta
            through: { attributes: [] }, // Especificar el nombre de la tabla intermedia en mayúsculas
          },
          {
            model: User,
            attributes: ["id", "name"],
          },
        ],
      });

      return res.json(questions);
    } else {
      return next(new AppError("Etiqueta no encontrada!", 404));
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error al obtener preguntas por etiqueta" });
  }
};

exports.createTag = async (req, res) => {
  const { name, description } = req.body;
  try {
    const tag = await Tag.create({
      name,
      description,
    });
    return res.json(tag);
  } catch (error) {
    console.error(error);
    if ((error.name = "SequelizeUniqueConstraintError")) {
      return res
        .status(401)
        .json({ message: "Ya existe este nombre de etiqueta!" });
    } else {
      return res.status(500).json({ mensaje: "Hubo un error al crear el tag" });
    }
  }
};
