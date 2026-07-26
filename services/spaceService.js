const Space = require('../models/Space');
const AppError = require('../utils/AppError');

const validateSchedule = (openingTime, closingTime) => {
  if (openingTime >= closingTime) {
    throw new AppError('La hora de cierre debe ser posterior a la hora de apertura', 400);
  }
};

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

const createSpace = async (data) => {
  const { name, type, location, capacity, openingTime, closingTime } = data;

  if (!name || !type || !location || capacity === undefined || !openingTime || !closingTime) {
    throw new AppError(
      'Nombre, tipo, ubicación, capacidad, hora de apertura y hora de cierre son obligatorios',
      400
    );
  }

  validateSchedule(openingTime, closingTime);

  return Space.create({ name, type, location, capacity, openingTime, closingTime });
};

const updateSpace = async (id, data) => {
  const space = await Space.findById(id);
  if (!space) {
    throw new AppError('Espacio no encontrado', 404);
  }

  const updates = {};
  const fields = ['name', 'type', 'location', 'capacity', 'openingTime', 'closingTime'];

  for (const field of fields) {
    if (data[field] !== undefined) updates[field] = data[field];
  }

  const openingTime = updates.openingTime ?? space.openingTime;
  const closingTime = updates.closingTime ?? space.closingTime;
  validateSchedule(openingTime, closingTime);

  const updated = await Space.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  return updated;
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
