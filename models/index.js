const User = require("./user.model");
const Question = require("./question.model");
const Tag = require("./tag.model");
const Response = require("./response.model");
const File = require("./file.model");
const Resource = require("./resource.model");

User.hasMany(Question);
Question.belongsTo(User);

User.hasMany(Response);
Response.belongsTo(User);

Question.hasMany(Response);
Response.belongsTo(Question);

Question.belongsToMany(Tag, { through: "QuestionTag" });
Tag.belongsToMany(Question, { through: "QuestionTag" });

User.hasMany(Resource);
Resource.belongsTo(User);

Resource.hasMany(File);
File.belongsTo(Resource);

module.exports = {
  User,
  Question,
  Tag,
  Response,
  Resource,
  File,
};
