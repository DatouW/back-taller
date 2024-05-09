const express = require("express");
const tagController = require("../controllers/tag.controller");

const router = express.Router();

router.route("/").get(tagController.getAllTags).post(tagController.createTag);

router.route("/:id").get(tagController.getQuestionsByTag);

module.exports = router;
