const express = require("express");
const responseController = require("../controllers/response.controller");
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

module.exports = router;
