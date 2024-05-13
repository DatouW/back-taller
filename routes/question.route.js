const express = require("express");
const QuestionController = require("../controllers/question.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router
  .route("/")
  .get(QuestionController.getAllQuestions)
  .post(authMiddleware.verifyToken, QuestionController.createQuestion);

router
  .route("/:id")
  .get(QuestionController.getQuestionById)
  .put(authMiddleware.verifyToken, QuestionController.updateQuestion)
  .delete(authMiddleware.verifyToken, QuestionController.deleteQuestion);

router.get(
  "/v1/user",
  authMiddleware.verifyToken,
  QuestionController.getQuestionsByUser
);

module.exports = router;
