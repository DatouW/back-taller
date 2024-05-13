const express = require("express");
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router
  .route("/")
  .get(categoryController.getAllCategories)
  .post(authMiddleware.verifyToken, categoryController.createCategory);

router
  .route("/:id")
  .get(categoryController.getCategoryWithResources)
  .put(authMiddleware.verifyToken, categoryController.updateCategory);

module.exports = router;
