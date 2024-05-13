const express = require("express");
const responseController = require("../controllers/answer.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router
  .route("/")
  .post(authMiddleware.verifyToken, responseController.createResponse);

router
  .route("/:id")
  .get(responseController.getResponse)
  .put(authMiddleware.verifyToken, responseController.updateResponse)
  .delete(authMiddleware.verifyToken, responseController.deleteResponse);

router.get(
  "/v1/user",
  authMiddleware.verifyToken,
  responseController.getResponsesByUser
);
module.exports = router;
