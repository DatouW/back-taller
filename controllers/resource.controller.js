const { Resource, File, User } = require("../models");
const sequelize = require("../database");
const { uploadFile, deleteFile } = require("../utils/cloudinaryUtil");
const { assignPoints } = require("./../utils/pointUtil");
const {
  COMPARTIR_RECURSO,
  Points,
  ELIMINAR_RECURSO,
} = require("../utils/constant");

exports.getAllResources = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  // Convert page and pageSize to integers and ensure they are valid
  const pageInt = parseInt(page, 10);
  const pageSizeInt = parseInt(pageSize, 10);
  const offset = (pageInt - 1) * pageSizeInt;
  const limit = pageSizeInt;
  try {
    const { count, rows } = await Resource.findAndCountAll({
      offset,
      limit,
      order: [["createdAt", "DESC"]],
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
    res.status(500).json({
      message: "Error occurred while fetching resources: " + error.message,
    });
  }
};

exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
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
    });
    return res.json(resource);
  } catch (error) {
    res.status(500).json({
      message: "Error occurred while fetching resource: " + error.message,
    });
  }
};

exports.getResourcesByUser = async (req, res) => {
  try {
    const resource = await Resource.findAll({
      where: { UserId: req.user.id },
      include: [
        {
          model: File,
          attributes: ["id", "filename", "path_url"],
        },
      ],
    });
    return res.json(resource);
  } catch (error) {
    res.status(500).json({
      message: "Error occurred while fetching resource: " + error.message,
    });
  }
};

exports.uploadToCloud = async (req, res, next) => {
  const { description, categoryId } = req.body;
  let promises = [];
  let files = req.files;
  //console.log(files);

  try {
    let resource;
    for (let i = 0; i < files.length; i++) {
      const processResult = async (result) => {
        // Guardar en el modelo Resource
        if (!resource)
          resource = await Resource.create({
            description,
            UserId: req.user.id,
            CategoryId: categoryId,
          });

        // Guardar en el modelo File
        const file = await File.create({
          filename: files[i].originalname,
          path_url: result.url,
          ResourceId: resource.id,
        });

        return file;
      };
      let cloudinaryUploadPromise = await uploadFile(
        files[i],
        "platform/resources",
        processResult
      );
      await assignPoints(
        req.user.id,
        COMPARTIR_RECURSO,
        Points.COMPARTIR_RECURSO
      );
      promises.push(cloudinaryUploadPromise);
    }

    Promise.all(promises)
      .then((resultArr) => {
        res.json({ resource, files: resultArr });
      })
      .catch((error) => {
        res.status(400).json(error);
      });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Error occurred while uploading: " + error.message });
  }
};

exports.deleteResource = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();

    // Buscar el recurso
    const resource = await Resource.findByPk(req.params.id, { transaction });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Buscar los archivos asociados al recurso
    const files = await File.findAll({
      where: { ResourceId: resource.id },
      transaction,
    });

    // Eliminar cada archivo de Cloudinary y la tabla File
    for (let file of files) {
      // Eliminar de Cloudinary
      await deleteFile(file.path_url, "platform/resources");
      // Eliminar de la tabla File
      await file.destroy({ transaction });
    }

    // Eliminar el recurso
    await resource.destroy({ transaction });

    await assignPoints(
      resource.UserId,
      ELIMINAR_RECURSO,
      Points.DELETE_RECURSO
    );

    await transaction.commit();

    return res.json({
      message: "Resource and associated files have been deleted",
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

exports.updateResource = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const files = req.files;
    // Buscar el recurso
    const resource = await Resource.findByPk(req.params.id, { transaction });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Buscar los archivos de File asociados a la Resource
    let existingFiles = await File.findAll({
      where: { ResourceId: resource.id },
      transaction,
    });

    let newFiles = [];

    for (let i = 0; i < files.length; i++) {
      const fileIndex = existingFiles.findIndex(
        (file) => file.filename === files[i].originalname
      );

      if (fileIndex === -1) {
        // Si el archivo no existe en el modelo File, se sube
        let result = await uploadFile(
          files[i],
          "platform/resources",
          (result) => result
        );

        let file = await File.create(
          {
            filename: files[i].originalname,
            path_url: result.url,
            ResourceId: resource.id,
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
        await deleteFile(existingFiles[j].path_url, "platform/resources");
        await existingFiles[j].destroy({ transaction });
      }
    }

    await transaction.commit();

    res.json({ message: "Resource and files updated." });
  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    res
      .status(500)
      .json({ message: "Error occurred while updating: " + err.message });
  }
};
