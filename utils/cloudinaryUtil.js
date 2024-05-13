const cloudinary = require("../config/cloudinaryConfig");
const path = require("path");

const uploadFile = (file, folder, processResult) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          format: path.parse(file.originalname).ext.substring(1),
          folder,
        },
        async function (error, result) {
          if (error) {
            reject("Error occurred while uploading file: " + error.message);
          } else {
            // processResult es una función que se pasa como argumento para manejar el resultado
            try {
              const returnVal = await processResult(result);
              resolve(returnVal);
            } catch (error) {
              reject(
                "Error occurred while processing result: " + error.message
              );
            }
          }
        }
      )
      .end(file.buffer);
  });
};

const deleteFile = async (url, folder = "") => {
  const public_id = folder + path.parse(url).name;
  // Dividir la URL en segmentos
  const pathSegments = url.split("/");
  const resource_type = pathSegments[4];
  //console.log(resource_type);
  //console.log(public_id);
  // Eliminar el archivo de Cloudinary
  await cloudinary.uploader.destroy(public_id, { resource_type });
};

module.exports = { uploadFile, deleteFile };
