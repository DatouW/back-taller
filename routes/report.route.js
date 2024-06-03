const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(reportController.getAllReports);

router
  .route("/:id")
  .get(reportController.getReportWithDetails)
  .post(authMiddleware.verifyToken, reportController.handleReport);

module.exports = router;
