const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resource.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");

router
  .route("/")
  .get(resourceController.getAllResources)
  .post(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    resourceController.uploadToCloud
  );

router
  .route("/:id")
  .get(resourceController.getResource)
  .delete(authMiddleware.verifyToken, resourceController.deleteResource)
  .put(
    authMiddleware.verifyToken,
    uploadMiddleware.uploadFiles,
    resourceController.updateResource
  );
module.exports = router;
