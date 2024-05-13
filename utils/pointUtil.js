const { Point } = require("../models");

const assignPoints = async (UserId, action, points) => {
  await Point.create({
    UserId,
    action,
    points,
  }); // Assign 10 points for signup
};

const getUserTotalPoints = async (UserId) => {
  const totalPoints = await Point.sum("points", {
    where: {
      UserId,
    },
  });
  return totalPoints;
};

module.exports = { assignPoints, getUserTotalPoints };
