const { Category, Resource } = require("../models");

exports.getAllCategories = async (req, res) => {
  try {
    const cates = await Category.findAll();
    return res.json(cates);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al obtener las categorias" });
  }
};

exports.getCategoryWithResources = async (req, res) => {
  const { id } = req.params;

  try {
    const cate = await Category.findByPk(id, {
      include: {
        model: Resource,
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
      },
    });

    if (!cate) {
      return res.status(404).json({ mensaje: "Categoria no encontrada" });
    }

    return res.json(cate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Hubo un error al buscar la categoria" });
  }
};
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const cate = await Category.create({
      name,
    });
    return res.json(cate);
  } catch (error) {
    console.error(error);
    if ((error.name = "SequelizeUniqueConstraintError")) {
      return res
        .status(401)
        .json({ message: "Ya existe este nombre de categoria!" });
    } else {
      return res
        .status(500)
        .json({ mensaje: "Hubo un error al crear la categoria" });
    }
  }
};
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await Category.update({ name }, { where: { id } });
    return res.json({ mensaje: "Categoria actualizada correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al actualizar la categoria" });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await Category.destroy({ where: { id } });
    return res.json({ mensaje: "Categoria eliminada correctamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al eliminar la categoria" });
  }
};
