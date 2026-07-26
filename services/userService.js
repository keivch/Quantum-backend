const User = require('../models/User');
const AppError = require('../utils/AppError');
const { normalizeEmail, isValidEmail } = require('../utils/email');

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  active: user.active,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getAllUsers = async () => {
  return User.find().select('-password');
};

const getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return user;
};

const createUser = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    throw new AppError('Nombre, correo y contraseña son obligatorios', 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError('El correo no tiene un formato válido', 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    throw new AppError('El correo ya está registrado', 400);
  }

  return User.create({
    name,
    email: normalizedEmail,
    password,
    role: role || 'operator',
  });
};

const updateUser = async (id, { name, email, role, active }) => {
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (email !== undefined) {
    if (!isValidEmail(email)) {
      throw new AppError('El correo no tiene un formato válido', 400);
    }
    updates.email = normalizeEmail(email);
  }
  if (role !== undefined) updates.role = role;
  if (active !== undefined) updates.active = active;

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return user;
};

const deactivateUser = async (id) => {
  const user = await User.findById(id).select('-password');

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (!user.active) {
    throw new AppError('El usuario ya está inactivo', 400);
  }

  user.active = false;
  await user.save();

  return user;
};

const activateUser = async (id) => {
  const user = await User.findById(id).select('-password');

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (user.active) {
    throw new AppError('El usuario ya está activo', 400);
  }

  user.active = true;
  await user.save();

  return user;
};

module.exports = {
  formatUser,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
};
