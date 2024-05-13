const { User } = require("../models");
const { uploadFile, deleteFile } = require("../utils/cloudinaryUtil");

exports.getAllUsers = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    return res.json(usuarios);
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
