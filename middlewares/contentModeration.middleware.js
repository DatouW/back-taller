const fs = require("fs").promises;
const path = require("path");
const openai = require("../config/openaiConfig");
const { Report } = require("../models");
const { assignPoints } = require("./../utils/pointUtil");
const {
  Status,
  PUBLICAR_PREGUNTA,
  PUBLICAR_RESPUESTA,
} = require("../utils/constant");

exports.checkInappropriateContent = async (req, res, next) => {
  const { id, model, isNew } = req;
  const record = await model.findByPk(id);

  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }
  const isQuestion = model.name === "Question";

  const textToCheck = isQuestion
    ? `Titulo: ${record.title}. Contenido: ${record.content}`
    : record.description;

  //console.log(isQuestion);

  const promptPath = path.resolve(__dirname, "../prompt.txt");

  try {
    const prompt = await fs.readFile(promptPath, "utf8");
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: textToCheck },
      ],
      model: "gpt-3.5-turbo",
    });

    console.log(response.choices[0]);

    const responseContent = response.choices[0].message.content;
    let contentobj;
    try {
      contentobj = JSON.parse(responseContent);
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError.message);
      contentobj = {
        status: "yes",
        classification: "Potencialmente Inapropiado",
        reason: "Se ha fallado la detección automática",
      };
    }
    console.log(contentobj);

    if (contentobj.status === "yes") {
      const reportData = {
        classification: contentobj.classification,
        reason: contentobj.reason,
        modelType: isQuestion ? "Pregunta" : "Respuesta",
        QuestionId: isQuestion ? record.id : null,
        ResponseId: isQuestion ? null : record.id,
      };

      await Report.create(reportData);

      record.status = isNew ? Status.PENDING_REVIEW_F : Status.PENDING_REVIEW;
      await record.save();
      return res
        .status(400)
        .json({ message: "Contenido Inapropiado detectado" });
    } else if (isNew) {
      const pointAction = isQuestion ? PUBLICAR_PREGUNTA : PUBLICAR_RESPUESTA;

      const pointValue = isQuestion ? -3 : 5;

      await assignPoints(req.user.id, pointAction, pointValue);

      record.status = Status.APPROVED;
      await record.save();

      return res.json({ message: "Acción ejecutada con éxito" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error during content check" });
  }
};
