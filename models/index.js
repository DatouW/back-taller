const User = require("./user.model");
const Question = require("./question.model");
const Tag = require("./tag.model");
const Response = require("./answer.model");
const File = require("./file.model");
const Resource = require("./resource.model");
const Point = require("./point.model");
const Like = require("./like.model");
const Category = require("./category.model");
const Report = require("./report.model");

User.hasMany(Question);
Question.belongsTo(User);

User.hasMany(Response);
Response.belongsTo(User);

User.hasMany(Resource);
Resource.belongsTo(User);

User.hasMany(Point);
Point.belongsTo(User);

User.hasMany(Like);
Like.belongsTo(User);

Question.hasMany(Response);
Response.belongsTo(Question);

Question.belongsToMany(Tag, { through: "QuestionTag" });
Tag.belongsToMany(Question, { through: "QuestionTag" });

Resource.hasMany(File);
File.belongsTo(Resource);

Question.hasMany(File);
File.belongsTo(Question);

Response.hasMany(File);
File.belongsTo(Response);

Response.hasMany(Like);
Like.belongsTo(Response);

Category.hasMany(Resource);
Resource.belongsTo(Category);

Question.hasMany(Report);
Report.belongsTo(Question);

Response.hasMany(Report);
Report.belongsTo(Response);

module.exports = {
  User,
  Question,
  Tag,
  Response,
  Resource,
  File,
  Point,
  Like,
  Category,
  Report,
};
