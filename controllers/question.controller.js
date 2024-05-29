const { Op } = require("sequelize");
const { Question, Tag, User, File } = require("../models");
const sequelize = require("../database");
const { uploadFile, deleteFile } = require("../utils/cloudinaryUtil");
const { assignPoints, getUserTotalPoints } = require("./../utils/pointUtil");

exports.createQuestion = async (req, res) => {
  const { title, content, tags } = req.body;
  try {
    const totalPoints = await getUserTotalPoints(req.user.id);
    if (totalPoints < 3) {
      return res
        .status(401)
        .json({ message: "Punto insuficiente para publicar una pregunta" });
    }
    const newQuestion = await Question.create({
      title,
      content,
      UserId: req.user.id,
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
    let filesArr = [];
    if (req.files) {
      let files = req.files;
      try {
        for (let i = 0; i < files.length; i++) {
          const processResult = async (result) => {
            // Guardar en el modelo File
            const file = await File.create({
              filename: files[i].originalname,
              path_url: result.url,
              QuestionId: newQuestion.id,
            });

            return file;
          };
          let cloudinaryUploadPromise = await uploadFile(
            files[i],
            "platform/questions",
            processResult
          );

          promises.push(cloudinaryUploadPromise);
        }

        Promise.all(promises)
          .then((resultArr) => {
            filesArr = resultArr;
          })
          .catch((error) => {
            return res.status(400).json({ message: "Error:" + error });
          });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          message: "Error occurred while uploading: " + error.message,
        });
      }
    }
    await assignPoints(req.user.id, "Publicar pregunta", -3);
    newQuestion.dataValues.files = filesArr;
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
        {
          model: File,
          attributes: ["id", "filename", "path_url"],
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
        {
          model: File,
          attributes: ["id", "filename", "path_url"],
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
          {
            model: File,
            attributes: ["id", "filename", "path_url"],
          },
        ],
      });
      for (let resp of responses) {
        resp.score = await resp.calculateScore();
      }
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
        {
          model: File,
          attributes: ["id", "filename", "path_url"],
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
  let transaction;

  try {
    transaction = await sequelize.transaction();

    // Buscar el question
    const question = await Question.findByPk(req.params.id, { transaction });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    await deleteFiles(question, transaction);
    // Eliminar la pregunta
    await question.destroy({ transaction });

    await transaction.commit();

    return res.json({
      message: "Question and associated files have been deleted",
    });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }
    res
      .status(500)
      .json({ message: "Error occurred while deleting: " + err.message });
  }
};

exports.updateQuestion = async (req, res, next) => {
  const { id } = req.params;
  //const { title, content } = req.body;

  let transaction;

  try {
    transaction = await sequelize.transaction();
    // Buscar el question
    const question = await Question.findByPk(id, { transaction });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    // question.title = title;
    // question.content = content;
    // await question.save({ transaction });
    // Buscar los archivos de File asociados a la Resource
    let existingFiles = await File.findAll({
      where: { QuestionId: question.id },
      transaction,
    });

    let newFiles = [];

    if (req.files) {
      const files = req.files;
      console.log(files);
      for (let i = 0; i < files.length; i++) {
        const fileIndex = existingFiles.findIndex(
          (file) => file.filename === files[i].originalname
        );

        if (fileIndex === -1) {
          // Si el archivo no existe en el modelo File, se sube
          let result = await uploadFile(
            files[i],
            "platform/questions",
            (result) => result
          );

          let file = await File.create(
            {
              filename: files[i].originalname,
              path_url: result.url,
              QuestionId: question.id,
            },
            { transaction }
          );

          newFiles.push(file);
        }
      }

      // Para cada archivo existente que no esté en los archivos subidos nuevamente, se elimina
      for (let j = 0; j < existingFiles.length; j++) {
        if (
          !files.some((file) => file.originalname === existingFiles[j].filename)
        ) {
          await deleteFile(existingFiles[j].path_url, "platform/questions");
          await existingFiles[j].destroy({ transaction });
        }
      }
    } else {
      await deleteFiles(question, transaction);
    }

    await transaction.commit();

    res.json({ message: "Question and files updated." });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    res
      .status(500)
      .json({ message: "Error occurred while updating: " + err.message });
  }
};

const deleteFiles = async (question, transaction) => {
  // Buscar los archivos asociados al question
  const files = await File.findAll({
    where: { QuestionId: question.id },
    transaction,
  });
  // Eliminar cada archivo de Cloudinary y la tabla File
  for (let file of files) {
    // Eliminar de Cloudinary
    await deleteFile(file.path_url, "platform/questions");
    // Eliminar de la tabla File
    await file.destroy({ transaction });
  }
};

exports.searchQuestions = async (req, res) => {
  const { query, startDate, endDate, tag } = req.query;
  //console.log(query, author, startDate, endDate, tag);

  const searchCriteria = {
    where: {},
    include: [
      {
        model: User,
        attributes: ["id", "name"],
      },
      {
        model: Tag,
        attributes: ["id", "name"],
        through: { attributes: [] },
      },
      {
        model: File,
        attributes: ["id", "filename", "path_url"],
      },
    ],
  };

  if (query) {
    searchCriteria.where = {
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { content: { [Op.iLike]: `%${query}%` } },
      ],
    };
    searchCriteria.include[0].where = {
      name: {
        [Op.iLike]: `%${author}%`,
      },
    };
  }

  if (startDate || endDate) {
    let start = startDate ? new Date(startDate) : new Date("1970-01-01");
    let end = endDate ? new Date(endDate) : new Date();
    searchCriteria.where.createdAt = {
      [Op.between]: [start, end],
    };
  }

  if (tag) {
    searchCriteria.include[1].where = {
      name: {
        [Op.iLike]: `%${tag}%`,
      },
    };
  }

  try {
    const questions = await Question.findAll(searchCriteria);
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al realizar la búsqueda" });
  }
};
