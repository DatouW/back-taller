const express = require("express");
const userController = require("../controllers/user.controller");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .put(authMiddleware.verifyToken, userController.updateUser)
  .delete(authMiddleware.verifyToken, userController.deleteUser);

module.exports = router;
