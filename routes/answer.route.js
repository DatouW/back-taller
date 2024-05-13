const express = require("express");
const responseController = require("../controllers/answer.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");

const router = express.Router();

router
  .route("/")
  .post(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    responseController.createResponse
  );

router
  .route("/:id")
  .get(responseController.getResponse)
  .put(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    responseController.updateResponse
  )
  .delete(authMiddleware.verifyToken, responseController.deleteResponse);

router.get(
  "/v1/user",
  authMiddleware.verifyToken,
  responseController.getResponsesByUser
);
module.exports = router;
