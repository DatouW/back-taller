const { Op } = require("sequelize");
const { Question, Tag, User, File, Report } = require("../models");
const sequelize = require("../database");
const { uploadFile, deleteFile } = require("../utils/cloudinaryUtil");
const { getUserTotalPoints, assignPoints } = require("./../utils/pointUtil");
const { Status, ELIMINAR_PREGUNTA, Points } = require("./../utils/constant");

exports.createQuestion = async (req, res, next) => {
  const { title, content, tags } = req.body;
  try {
    const totalPoints = await getUserTotalPoints(req.user.id);
    if (totalPoints < 3) {
      return res
        .status(401)
        .json({ message: "Puntos insuficientes para publicar una pregunta" });
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
      const promises = []; // Definir la variable promises aquí

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

          let cloudinaryUploadPromise = uploadFile(
            files[i],
            "platform/questions",
            processResult
          );

          promises.push(cloudinaryUploadPromise);
        }

        const resultArr = await Promise.all(promises);
        filesArr = resultArr;
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          message: "Error occurred while uploading: " + error.message,
        });
      }
    }

    newQuestion.dataValues.files = filesArr;

    req.id = newQuestion.id;
    req.model = Question;
    req.isNew = true;
    next();
    //return res.json(newQuestion);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getAllQuestions = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  // Convert page and pageSize to integers and ensure they are valid
  const pageInt = parseInt(page, 10);
  const pageSizeInt = parseInt(pageSize, 10);
  const offset = (pageInt - 1) * pageSizeInt;
  const limit = pageSizeInt;

  try {
    const { count, rows } = await Question.findAndCountAll({
      offset,
      limit,
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
      where: { status: Status.APPROVED },
      order: [["createdAt", "DESC"]],
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
        where: { status: Status.APPROVED },
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

exports.reportQuestion = async (req, res, next) => {
  const { id } = req.params;
  try {
    const question = await Question.findByPk(id);
    if (question) {
      await Report.create({
        reason: "Reportado por usuario",
        classification: "Potencialmente Inapropiado",
        modelType: "Pregunta",
        status: Status.PENDING_REVIEW,
        QuestionId: id,
      });
      question.status = Status.PENDING_REVIEW;
      await question.save();
      return res.json({ message: "Se ha reportado la pregunta con exito." });
    } else {
      return res
        .status(404)
        .json({ message: "No se ha encontrado la pregunta reportada" });
    }
  } catch (error) {
    console.error(error);

    return res
      .status(500)
      .json({ mensaje: "Hubo un error al reportar la respuesta" });
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

    await assignPoints(
      question.UserId,
      ELIMINAR_PREGUNTA,
      Points.DELETE_PREGUNTA
    );

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
  const { title, content } = req.body;

  let transaction;

  try {
    transaction = await sequelize.transaction();
    // Buscar el question
    const question = await Question.findByPk(id, { transaction });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    question.title = title;
    question.content = content;
    await question.save({ transaction });

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

    req.id = id;
    req.model = Question;
    req.isNew = false;
    next();
    //res.json({ message: "Question and files updated." });
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
  const { query, startDate, endDate, tag, page = 1, pageSize = 10 } = req.query;

  // Log the received query parameters
  console.log("Query Parameters:", query, startDate, endDate, tag);

  const pageInt = parseInt(page, 10);
  const pageSizeInt = parseInt(pageSize, 10);
  const offset = (pageInt - 1) * pageSizeInt;
  const limit = pageSizeInt;

  const searchCriteria = {
    where: {
      status: Status.APPROVED,
    },
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

  // Add query conditions if query exists
  if (query) {
    searchCriteria.where[Op.or] = [
      { title: { [Op.iLike]: `%${query}%` } },
      { content: { [Op.iLike]: `%${query}%` } },
      { "$User.name$": { [Op.iLike]: `%${query}%` } },
    ];
  }

  // Add date range filter
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date("1970-01-01");
    const end = endDate ? new Date(endDate) : new Date();
    searchCriteria.where.createdAt = {
      [Op.between]: [start, end],
    };
  }

  // Add tag filter if provided
  if (tag) {
    searchCriteria.include[1].where = {
      name: {
        [Op.iLike]: `%${tag}%`,
      },
    };
  }

  // Log the generated search criteria
  console.log("Search Criteria:", JSON.stringify(searchCriteria, null, 2));

  try {
    // Consulta principal sin paginación
    const questions = await Question.findAll(searchCriteria);

    // Aplicar paginación manualmente
    const totalItems = questions.length;
    const paginatedQuestions = questions.slice(offset, offset + pageSizeInt);
    const totalPages = Math.ceil(totalItems / pageSizeInt);

    return res.json({
      totalItems,
      totalPages,
      currentPage: pageInt,
      pageSize: pageSizeInt,
      data: paginatedQuestions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al realizar la búsqueda" });
  }
};
