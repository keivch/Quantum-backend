const Reservation = require('../models/Reservation');
const Space = require('../models/Space');
const AppError = require('../utils/AppError');
const { isValidEmail, normalizeEmail } = require('../utils/email');

const ALLOWED_SORT_FIELDS = ['startDate', 'createdAt'];
const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
const CREATE_STATUSES = ['pending', 'confirmed'];
const UPDATE_STATUSES = ['pending', 'confirmed', 'completed'];
const TERMINAL_STATUSES = ['cancelled', 'completed'];

const validateDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Las fechas no son válidas', 400);
  }

  if (end <= start) {
    throw new AppError('La fecha de fin debe ser posterior a la fecha de inicio', 400);
  }

  return { start, end };
};

const validateAttendees = (attendees, space) => {
  const count = Number(attendees);

  if (!Number.isInteger(count) || count < 1) {
    throw new AppError('El número de asistentes debe ser al menos 1', 400);
  }

  if (space && count > space.capacity) {
    throw new AppError(
      `El número de asistentes no puede superar la capacidad del espacio (${space.capacity})`,
      400
    );
  }

  return count;
};

const validateSpaceForReservation = async (spaceId) => {
  const space = await Space.findById(spaceId);
  if (!space) {
    throw new AppError('Espacio no encontrado', 404);
  }
  if (!space.active) {
    throw new AppError('No se pueden crear reservas en espacios inactivos', 400);
  }
  return space;
};

const populateOptions = [
  { path: 'space', select: 'name type location capacity active' },
  { path: 'createdBy', select: 'name email' },
];

const buildQuery = (filters) => {
  const query = {};

  if (filters.search) {
    const regex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ title: regex }, { clientName: regex }, { clientEmail: regex }];
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.space) {
    query.space = filters.space;
  }

  if (filters.startDateFrom || filters.startDateTo) {
    query.startDate = {};
    if (filters.startDateFrom) {
      query.startDate.$gte = new Date(filters.startDateFrom);
    }
    if (filters.startDateTo) {
      const to = new Date(filters.startDateTo);
      to.setHours(23, 59, 59, 999);
      query.startDate.$lte = to;
    }
  }

  return query;
};

const getReservations = async (queryParams) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const sortField = ALLOWED_SORT_FIELDS.includes(queryParams.sortBy)
    ? queryParams.sortBy
    : 'startDate';
  const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

  const query = buildQuery(queryParams);

  const [data, total] = await Promise.all([
    Reservation.find(query)
      .populate(populateOptions)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    Reservation.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getReservationById = async (id) => {
  const reservation = await Reservation.findById(id).populate([
    {
      path: 'space',
      select: 'name type location capacity openingTime closingTime active',
    },
    { path: 'createdBy', select: 'name email' },
  ]);

  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404);
  }

  return reservation;
};

const createReservation = async (data, userId) => {
  const {
    title,
    clientName,
    clientEmail,
    attendees,
    space,
    startDate,
    endDate,
    status,
    notes,
  } = data;

  if (
    !title ||
    !clientName ||
    !clientEmail ||
    attendees === undefined ||
    !space ||
    !startDate ||
    !endDate
  ) {
    throw new AppError(
      'Título, nombre del cliente, correo, asistentes, espacio, fecha de inicio y fecha de fin son obligatorios',
      400
    );
  }

  if (!isValidEmail(clientEmail)) {
    throw new AppError('El correo del cliente no tiene un formato válido', 400);
  }

  if (status && !CREATE_STATUSES.includes(status)) {
    throw new AppError('Solo se puede crear una reserva en estado pendiente o confirmado', 400);
  }

  const spaceDoc = await validateSpaceForReservation(space);
  const attendeeCount = validateAttendees(attendees, spaceDoc);
  const { start, end } = validateDates(startDate, endDate);

  return Reservation.create({
    title,
    clientName,
    clientEmail: normalizeEmail(clientEmail),
    attendees: attendeeCount,
    space,
    startDate: start,
    endDate: end,
    status: status || 'pending',
    notes: notes || '',
    createdBy: userId,
  }).then((r) => r.populate(populateOptions));
};

const updateReservation = async (id, data) => {
  const reservation = await Reservation.findById(id);
  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404);
  }

  if (TERMINAL_STATUSES.includes(reservation.status)) {
    throw new AppError('No se puede editar una reserva cancelada o completada', 400);
  }

  const updates = {};

  if (data.title !== undefined) updates.title = data.title;
  if (data.clientName !== undefined) updates.clientName = data.clientName;
  if (data.notes !== undefined) updates.notes = data.notes;

  if (data.clientEmail !== undefined) {
    if (!isValidEmail(data.clientEmail)) {
      throw new AppError('El correo del cliente no tiene un formato válido', 400);
    }
    updates.clientEmail = normalizeEmail(data.clientEmail);
  }

  if (data.status !== undefined) {
    if (!UPDATE_STATUSES.includes(data.status)) {
      throw new AppError('Estado de reserva no válido', 400);
    }
    if (data.status === 'cancelled') {
      throw new AppError('Use el endpoint de cancelación para cancelar una reserva', 400);
    }
    updates.status = data.status;
  }

  const spaceId = data.space ?? reservation.space;
  let spaceDoc = await Space.findById(spaceId);
  if (!spaceDoc) {
    throw new AppError('Espacio no encontrado', 404);
  }

  if (data.space !== undefined) {
    spaceDoc = await validateSpaceForReservation(spaceId);
    updates.space = spaceId;
  }

  if (data.attendees !== undefined) {
    updates.attendees = validateAttendees(data.attendees, spaceDoc);
  } else if (data.space !== undefined) {
    validateAttendees(reservation.attendees, spaceDoc);
  }

  const startDate = data.startDate ?? reservation.startDate;
  const endDate = data.endDate ?? reservation.endDate;
  if (data.startDate !== undefined || data.endDate !== undefined) {
    const { start, end } = validateDates(startDate, endDate);
    updates.startDate = start;
    updates.endDate = end;
  }

  const updated = await Reservation.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate(populateOptions);

  return updated;
};

const cancelReservation = async (id) => {
  const reservation = await Reservation.findById(id);
  if (!reservation) {
    throw new AppError('Reserva no encontrada', 404);
  }

  if (reservation.status === 'cancelled') {
    throw new AppError('La reserva ya está cancelada', 400);
  }

  if (reservation.status === 'completed') {
    throw new AppError('No se puede cancelar una reserva completada', 400);
  }

  const updated = await Reservation.findByIdAndUpdate(
    id,
    { status: 'cancelled' },
    { new: true }
  ).populate(populateOptions);

  return updated;
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
};
