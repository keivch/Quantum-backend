const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { normalizeEmail, isValidEmail } = require('../utils/email');
const { formatUser } = require('./userService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Correo y contraseña son obligatorios', 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError('El correo no tiene un formato válido', 400);
  }

  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Correo o contraseña incorrectos', 401);
  }

  if (!user.active) {
    throw new AppError('Tu cuenta está inactiva. Contacta al administrador.', 403);
  }

  return {
    token: generateToken(user._id),
    user: formatUser(user),
  };
};

const getMe = (user) => formatUser(user);

module.exports = { login, getMe };
