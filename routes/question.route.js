const express = require("express");
const QuestionController = require("../controllers/question.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");
const moderationMiddleware = require("../middlewares/contentModeration.middleware");

const router = express.Router();

router
  .route("/")
  .get(QuestionController.getAllQuestions)
  .post(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    QuestionController.createQuestion,
    moderationMiddleware.checkInappropriateContent
  );

router
  .route("/:id")
  .get(QuestionController.getQuestionById)
  .put(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    QuestionController.updateQuestion,
    moderationMiddleware.checkInappropriateContent
  )
  .delete(authMiddleware.verifyToken, QuestionController.deleteQuestion);

router.get("/v1/search", QuestionController.searchQuestions);

router.get(
  "/v1/user",
  authMiddleware.verifyToken,
  QuestionController.getQuestionsByUser
);

router.post(
  "/report/:id",
  authMiddleware.verifyToken,
  QuestionController.reportQuestion
);

module.exports = router;
