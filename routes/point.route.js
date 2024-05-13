const express = require("express");
const pointController = require("../controllers/point.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware.verifyToken, pointController.getTotalPoints);
router.post(
  "/unlike",
  authMiddleware.verifyToken,
  pointController.unlikeAnswer
);
router.post("/like", authMiddleware.verifyToken, pointController.likeAnswer);
router.post(
  "/download",
  authMiddleware.verifyToken,
  pointController.downloadResouces
);

module.exports = router;
