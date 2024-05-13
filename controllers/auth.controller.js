const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./../models/user.model");

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
  // 2) Check if user exists && password is correct
  let user = await User.findOne({
    where: { email },
  });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Incorrect email or password!" });
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
};

exports.signup = async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  try {
    const user = await User.findOne({
      where: {
        email,
      },
    });
    if (user) {
      return res.status(400).send({
        mensaje:
          "Este correo ya esta en uso o ya esta registrado. Prueba otro.",
      });
    } else {
      const nuevoUsuario = await User.create({
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        role,
        phone: phone ? phone : null,
      });
      nuevoUsuario.password = undefined;
      return res.json(nuevoUsuario);
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Hubo un error al crear el usuario" });
  }
};
