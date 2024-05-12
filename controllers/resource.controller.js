const cloudinary = require("../config/cloudinaryConfig");
const path = require("path");

const { Resource, File, User } = require("../models");
const sequelize = require("../database");

exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
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
    return res.json(resources);
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

exports.uploadToCloud = async (req, res, next) => {
  const { description, userId } = req.body;
  let promises = [];
  let files = req.files;
  console.log(files);

  try {
    let resource;
    for (let i = 0; i < files.length; i++) {
      let cloudinaryUploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
              format: path.parse(files[i].originalname).ext.substring(1),
              folder: "platform/resources",
            },
            async function (error, result) {
              if (error) {
                reject("Error occurred while uploading: " + error.message);
              } else {
                try {
                  // Guardar en el modelo Resource
                  resource = await Resource.create({
                    description,
                    UserId: userId,
                  });

                  // Guardar en el modelo File
                  const file = await File.create({
                    filename: files[i].originalname,
                    path_url: result.url,
                    ResourceId: resource.id,
                  });

                  resolve(file);
                } catch (error) {
                  reject(
                    "Error occurred while creating file and resource: " +
                      error.message
                  );
                }
              }
            }
          )
          .end(files[i].buffer);
      });

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
      let public_id = "platform/resources/" + path.parse(file.path_url).name;

      // Dividir la URL en segmentos
      const pathSegments = file.path_url.split("/");
      const resource_type = pathSegments[4];
      //console.log("--------" + fourthSegment);
      //console.log(public_id);
      await cloudinary.uploader.destroy(public_id, { resource_type });

      // Eliminar de la tabla File
      await file.destroy({ transaction });
    }

    // Eliminar el recurso
    await resource.destroy({ transaction });

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

const url = require("url");

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
        let result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: "auto",
                format: path.parse(files[i].originalname).ext.substring(1),
                folder: "platform/resources",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(files[i].buffer);
        });

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
        let public_id =
          "platform/resources/" + path.parse(existingFiles[j].path_url).name;

        // Dividir la URL en segmentos
        const pathSegments = existingFiles[j].path_url.split("/");
        const resource_type = pathSegments[4];

        await cloudinary.uploader.destroy(public_id, { resource_type });
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
