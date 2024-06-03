const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.route("/").get(reportController.getAllReports);

module.exports = router;
