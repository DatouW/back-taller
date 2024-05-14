const { Like, User, Response, Point } = require("../models");
const { assignPoints, getUserTotalPoints } = require("../utils/pointUtil");

exports.unlikeAnswer = async (req, res) => {
  const { responseId } = req.body;
  try {
    const like = await Like.findOne({
      where: { ResponseId: responseId, UserId: req.user.id },
    });

    if (like) {
      const answer = await Response.findByPk(responseId);
      if (!answer)
        return res.status(404).json({ message: "Respuesta no encontrada" });
      if (like.is_liked) {
        like.is_liked = false;
        await assignPoints(answer.UserId, "Like quitado de la respuesta", -1);
      }
      if (!like.is_unliked) {
        like.is_unliked = true;
        await assignPoints(answer.UserId, "Recibir Unlike a respuesta", -1);
      }
      await like.save();
    } else {
      await Like.create({
        UserId: req.user.id,
        ResponseId: responseId,
        is_unliked: true,
      });
      await assignPoints(answer.UserId, "Recibir Unlike a respuesta", -1);
    }
    return res.json({ message: "Se ha dado el Unlike correctamente." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Ocurrió un error al dar el Unlike: " + error.message,
    });
  }
};

exports.likeAnswer = async (req, res) => {
  const { responseId } = req.body;
  try {
    const answer = await Response.findByPk(responseId);
    if (!answer)
      return res.status(404).json({ message: "Respuesta no encontrada" });
    const like = await Like.findOne({
      where: { ResponseId: responseId, UserId: req.user.id },
      include: {
        model: User,
        attributes: ["id"],
      },
    });

    if (like) {
      if (like.is_unliked) {
        like.is_unliked = false;
        await assignPoints(answer.UserId, "Unlike quitado de la respuesta", 1);
      }

      if (!like.is_liked) {
        like.is_liked = true;
        await assignPoints(answer.UserId, "Recibir Like a respuesta", 1);
      }
      await like.save();
    } else {
      await Like.create({
        UserId: req.user.id,
        ResponseId: responseId,
        is_liked: true,
      });
      await assignPoints(answer.UserId, "Recibir Like a respuesta", 1);
    }
    return res.json({ message: "Se ha dado like correctamente." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocurrió un error al dar like: " + error.message });
  }
};

exports.getTotalPoints = async (req, res) => {
  try {
    const puntoTotal = await getUserTotalPoints(req.user.id);
    return res.json({ puntoTotal });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocurrió un error al obtener el punto total. " });
  }
};

exports.downloadResouces = async (req, res) => {
  try {
    const puntoTotal = await getUserTotalPoints(req.user.id);
    if (puntoTotal < 3) {
      return res.status(401).json({ message: "Punto Insuficiente" });
    }
    await assignPoints(req.user.id, "Descargar recursos", -3);
    return res.json({ puntoTotal });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocurrió un error al descargar resources. " });
  }
};

exports.getPointRecordsByUser = async (req, res) => {
  try {
    const points = await Point.findAll({
      where: { UserId: req.user.id },
    });
    return res.json(points);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocurrió un error al obtener historial de puntos. " });
  }
};
