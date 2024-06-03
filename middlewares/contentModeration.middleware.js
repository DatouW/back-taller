const fs = require("fs").promises;
const path = require("path");
const openai = require("../config/openaiConfig");
const { Report } = require("../models");
const { assignPoints } = require("./../utils/pointUtil");
const { Status } = require("../utils/constant");

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

    const str = response.choices[0].message.content;
    const contentobj = JSON.parse(str);
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

      record.status = Status.PENDING_REVIEW;
      await record.save();
      return res
        .status(400)
        .json({ message: "Contenido Inapropiado detectado" });
    } else if (isNew) {
      const pointAction = isQuestion
        ? "Publicar pregunta"
        : "Responder a la pregunta";

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
