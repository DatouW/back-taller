const { User } = require("../models");
const { uploadFile, deleteFile } = require("../utils/cloudinaryUtil");

exports.getAllUsers = async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;

  // Convert page and pageSize to integers and ensure they are valid
  const pageInt = parseInt(page, 10);
  const pageSizeInt = parseInt(pageSize, 10);
  const offset = (pageInt - 1) * pageSizeInt;
  const limit = pageSizeInt;
  try {
    const { count, rows } = await User.findAndCountAll({
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] },
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
      .json({ mensaje: "Hubo un error al obtener los usuarios" });
  }
};

exports.getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    return res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Hubo un error al buscar el usuario" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;
  try {
    await User.update({ name, email, phone }, { where: { id } });
    return res.json({ mensaje: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al actualizar el usuario" });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await User.update({ active: false }, { where: { id } });
    return res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al eliminar el usuario" });
  }
};

exports.uploadAvatar = async (req, res) => {
  const { file, user } = req;
  try {
    const processResult = async (result) => {
      const updateUser = await User.update(
        {
          photo_url: result.url,
        },
        {
          where: { id: user.id },
        }
      );

      return updateUser;
    };
    if (user.photo_url) {
      await deleteFile(user.photo_url, "platform/avatars/");
    }
    await uploadFile(file, "platform/avatars", processResult);
    return res.json({ message: "Foto de perfil actualizada con exito" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al subir el avatar del usuario" });
  }
};
