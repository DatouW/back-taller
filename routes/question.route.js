const express = require("express");
const QuestionController = require("../controllers/question.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");

const router = express.Router();

router
  .route("/")
  .get(QuestionController.getAllQuestions)
  .post(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    QuestionController.createQuestion
  );

router
  .route("/:id")
  .get(QuestionController.getQuestionById)
  .put(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    QuestionController.updateQuestion
  )
  .delete(authMiddleware.verifyToken, QuestionController.deleteQuestion);

router.get(
  "/v1/user",
  authMiddleware.verifyToken,
  QuestionController.getQuestionsByUser
);

module.exports = router;
