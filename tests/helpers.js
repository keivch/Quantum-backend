const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Space = require('../models/Space');

const createTestUser = async (overrides = {}) => {
  return User.create({
    name: 'Usuario Prueba',
    email: 'operador@quantum.com',
    password: 'Password123',
    role: 'operator',
    active: true,
    ...overrides,
  });
};

const getAuthToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

const createTestSpace = async (overrides = {}) =>
  Space.create({
    name: 'Sala Norte',
    type: 'sala_reuniones',
    location: 'Piso 2',
    capacity: 10,
    openingTime: '09:00',
    closingTime: '18:00',
    active: true,
    ...overrides,
  });

const buildReservationWindow = ({ dayOffset = 1, startHour = 10, durationHours = 2 } = {}) => {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(startHour, 0, 0, 0);

  const end = new Date(start);
  end.setHours(startHour + durationHours, 0, 0, 0);

  return {
    start,
    end,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const buildReservationPayload = (spaceId, window, overrides = {}) => ({
  title: 'Reunión de prueba',
  clientName: 'Cliente Demo',
  clientEmail: 'cliente@example.com',
  attendees: 5,
  space: spaceId,
  startDate: window.startDate,
  endDate: window.endDate,
  status: 'pending',
  ...overrides,
});

module.exports = {
  createTestUser,
  getAuthToken,
  createTestSpace,
  buildReservationWindow,
  buildReservationPayload,
};
