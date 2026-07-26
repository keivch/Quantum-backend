const Space = require('../models/Space');
const AppError = require('../utils/AppError');

const getAllSpaces = async () => {
  return Space.find().sort({ createdAt: -1 });
};

const getSpaceById = async (id) => {
  const space = await Space.findById(id);
  if (!space) {
    throw new AppError('Espacio no encontrado', 404);
  }
  return space;
};

const createSpace = async ({ name, description }) => {
  if (!name) {
    throw new AppError('El nombre es obligatorio', 400);
  }

  return Space.create({ name, description });
};

const updateSpace = async (id, { name, description }) => {
  const updates = {};

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;

  const space = await Space.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!space) {
    throw new AppError('Espacio no encontrado', 404);
  }

  return space;
};

const deactivateSpace = async (id) => {
  const space = await Space.findByIdAndUpdate(id, { active: false }, { new: true });

  if (!space) {
    throw new AppError('Espacio no encontrado', 404);
  }

  return space;
};

module.exports = {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deactivateSpace,
};
