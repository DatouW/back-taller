const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", require("./routes/user.route"));
app.use("/tags", require("./routes/tag.route"));
app.use("/questions", require("./routes/question.route"));
app.use("/responses", require("./routes/answer.route"));
app.use("/resources", require("./routes/resource.route"));
app.use("/categories", require("./routes/category.route"));

module.exports = app;
