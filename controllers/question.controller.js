const { Question, Tag, User } = require("../models");

exports.createQuestion = async (req, res) => {
  try {
    const { title, content, idUser, tags } = req.body;
    const newQuestion = await Question.create({
      title,
      content,
      UserId: idUser,
    });
    // Crear o encontrar las etiquetas y asociarlas a la pregunta
    if (tags && Array.isArray(tags) && tags.length > 0) {
      await Promise.all(
        tags.map(async (tagName) => {
          // Buscar la etiqueta en la base de datos
          let tag = await Tag.findOne({
            where: { name: tagName.toLowerCase() },
          });

          // Si la etiqueta no existe, crearla
          if (!tag) {
            tag = await Tag.create({ name: tagName.toLowerCase() });
          }

          // Asociar la etiqueta a la pregunta
          await newQuestion.addTag(tag);
        })
      );
    }
    return res.json(newQuestion);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.findAll({
      include: [
        {
          model: Tag,
          attributes: ["id", "name"], // Solo incluir los atributos id y name de la tabla Tag
          through: { attributes: [] }, // Evitar incluir la tabla intermedia QuestionTag
        },
        {
          model: User,
          attributes: ["id", "name"],
        },
      ],
    });
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener las preguntas" });
  }
};

exports.getQuestionById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const question = await Question.findByPk(id, {
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
    if (question) {
      const responses = await question.getResponses({
        include: [
          {
            model: User,
            attributes: ["id", "name"],
          },
        ],
      });
      return res.json({ question, responses });
    } else {
      return res.status(404).send({
        mensaje: "Pregunta no encontrada!",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la pregunta" });
  }
};

exports.getQuestionsByUser = async (req, res, next) => {
  try {
    const questions = await Question.findAll({
      include: [
        {
          model: Tag, // Incluir el modelo de Tag
          attributes: ["id", "name"], // No incluir atributos de Tag en la respuesta
          through: { attributes: [] }, // Especificar el nombre de la tabla intermedia en mayúsculas
        },
      ],
      where: { UserId: req.user.id },
    });
    return res.json(questions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al obtener la pregunta" });
  }
};

exports.deleteQuestion = async (req, res, next) => {
  const { id } = req.params;
  try {
    const deletedQuestionCount = await Question.destroy({ where: { id } });
    if (deletedQuestionCount) {
      return res.json({ message: "Pregunta eliminada correctamente" });
    } else {
      return res.status(404).send({
        mensaje: "Pregunta no encontrada!",
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar la pregunta" });
  }
};

exports.updateQuestion = async (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const [updatedCount] = await Question.update(
      { title, content },
      { where: { id } }
    );
    if (updatedCount) {
      return res.json({ message: "Pregunta actualizada correctamente" });
    } else {
      return res.status(404).send({
        mensaje: "Pregunta no encontrada!",
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar la pregunta" });
  }
};
