const User = require("./user.model");
const Question = require("./question.model");
const Tag = require("./tag.model");
const Response = require("./response.model");

User.hasMany(Question);
Question.belongsTo(User);

User.hasMany(Response);
Response.belongsTo(User);

Question.hasMany(Response);
Response.belongsTo(Question);

Question.belongsToMany(Tag, { through: "QuestionTag" });
Tag.belongsToMany(Question, { through: "QuestionTag" });

module.exports = {
  User,
  Question,
  Tag,
  Response,
};
