const { Response, Question, Resource, User, File } = require("../models");
const sequelize = require("../database");
const { uploadFile, deleteFile } = require("../utils/cloudinaryUtil");
const { assignPoints } = require("./../utils/pointUtil");

exports.createResponse = async (req, res) => {
  try {
    const { description, questionId, url_extern } = req.body;
    const newResponse = await Response.create({
      description,
      QuestionId: questionId,
      UserId: req.user.id,
      url_extern,
    });
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
              ResponseId: newResponse.id,
            });

            return file;
          };
          let cloudinaryUploadPromise = await uploadFile(
            files[i],
            "platform/answers",
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
    await assignPoints(req.user.id, "Responder a la pregunta", 5);
    newResponse.dataValues.files = filesArr;
    return res.json(newResponse);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.getResponse = async (req, res, next) => {
  const { id } = req.params;
  try {
    let response = await Response.findByPk(id, {
      include: {
        model: File,
        attributes: ["id", "filename", "path_url"],
      },
    });
    if (!response) {
      return res.status(404).send({
        mensaje: "Respuesta no encontrada!",
      });
    }
    response.score = await response.calculateScore();
    return res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la respuesta" });
  }
};

exports.getResponsesByUser = async (req, res) => {
  //console.log(req.user);
  try {
    const responses = await Response.findAll({
      where: { UserId: req.user.id },
      include: [
        {
          model: Question,
          attributes: ["id", "title"],
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

    return res.json(responses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la respuesta" });
  }
};

exports.updateResponse = async (req, res, next) => {
  const { id } = req.params;
  const { description } = req.body;
  let transaction;

  try {
    transaction = await sequelize.transaction();
    // Buscar el answer
    const answer = await Response.findByPk(id, { transaction });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }
    answer.description = description;

    await answer.save({ transaction });
    // Buscar los archivos de File asociados a la answer
    let existingFiles = await File.findAll({
      where: { ResponseId: answer.id },
      transaction,
    });

    let newFiles = [];

    if (req.files) {
      const files = req.files;
      for (let i = 0; i < files.length; i++) {
        const fileIndex = existingFiles.findIndex(
          (file) => file.filename === files[i].originalname
        );

        if (fileIndex === -1) {
          // Si el archivo no existe en el modelo File, se sube
          let result = await uploadFile(
            files[i],
            "platform/answers",
            (result) => result
          );

          let file = await File.create(
            {
              filename: files[i].originalname,
              path_url: result.url,
              ResponseId: answer.id,
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
          await deleteFile(existingFiles[j].path_url, "platform/answers");
          await existingFiles[j].destroy({ transaction });
        }
      }
    } else {
      await deleteFiles(answer, transaction);
    }

    await transaction.commit();

    res.json({ message: "Answer and files updated." });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    res
      .status(500)
      .json({ message: "Error occurred while updating: " + err.message });
  }
};

exports.deleteResponse = async (req, res, next) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();

    // Buscar el answer
    const answer = await Response.findByPk(req.params.id, { transaction });

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    await deleteFiles(answer, transaction);

    // Eliminar la pregunta
    await answer.destroy({ transaction });

    await transaction.commit();

    return res.json({
      message: "Answer and associated files have been deleted",
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

const deleteFiles = async (answer, transaction) => {
  // Buscar los archivos asociados al answer
  const files = await File.findAll({
    where: { ResponseId: answer.id },
    transaction,
  });
  // Eliminar cada archivo de Cloudinary y la tabla File
  for (let file of files) {
    // Eliminar de Cloudinary
    await deleteFile(file.path_url, "platform/answers");
    // Eliminar de la tabla File
    await file.destroy({ transaction });
  }
};
