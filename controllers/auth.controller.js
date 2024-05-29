const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { User, Point } = require("./../models");
const { assignPoints, getUserTotalPoints } = require("./../utils/pointUtil");
const { INICIAR_SESION, REGISTRAR_USUARIO } = require("./../utils/constant");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password!" });
  }

  try {
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Incorrect email or password!" });
    }

    // 3) Check if user has already logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(today);
    const lastLogin = await Point.findOne({
      where: {
        UserId: user.id,
        createdAt: { [Op.gte]: today },
        action: INICIAR_SESION,
      },
    });

    // 4) If user has not logged in today, assign points for the first login
    if (!lastLogin) {
      await assignPoints(user.id, INICIAR_SESION, 2); // Assign 2 points for the first login of the day
    }

    // 5) Calculate total points for the day
    const totalPoints = await getUserTotalPoints(user.id);

    user.dataValues.totalPoints = totalPoints;
    //console.log(user, user.totalPoints);

    // 6) If everything is ok, send token and total points to client
    createSendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.signup = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user) {
      return res.status(400).send({ message: "This email is already in use." });
    } else {
      // 1) Create user
      const newUser = await User.create({
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        role,
        phone,
      });

      // 2) Assign points for signup
      await assignPoints(newUser.id, REGISTRAR_USUARIO, 10); // Assign 10 points for signup

      // 3) Remove password from response
      newUser.password = undefined;

      return res.json(newUser);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
