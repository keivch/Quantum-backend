const Reservation = require('../models/Reservation');
const Space = require('../models/Space');
const AppError = require('../utils/AppError');
const { isValidEmail, normalizeEmail } = require('../utils/email');

const ALLOWED_SORT_FIELDS = ['startDate', 'createdAt'];

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
};

const CSV_HEADERS = [
  'Identificador',
  'Espacio',
  'Sede',
  'Inicio',
  'Fin',
  'Estado',
  'Cliente',
  'Correo',
  'Asistentes',
  'Usuario creador',
  'Fecha de creación',
];
const CREATE_STATUSES = ['pending', 'confirmed'];
const UPDATE_STATUSES = ['pending', 'confirmed', 'completed'];
const TERMINAL_STATUSES = ['cancelled', 'completed'];
const BLOCKING_STATUSES = ['pending', 'confirmed'];

const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const getDateTimeMinutes = (date) => date.getHours() * 60 + date.getMinutes();

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

const validateNotPastDate = (start) => {
  if (start < new Date()) {
    throw new AppError('No se pueden crear reservas en fechas pasadas', 400);
  }
};

const validateWithinOpeningHours = (start, end, space) => {
  const openingMinutes = parseTimeToMinutes(space.openingTime);
  const closingMinutes = parseTimeToMinutes(space.closingTime);
  const startMinutes = getDateTimeMinutes(start);
  const endMinutes = getDateTimeMinutes(end);

  if (openingMinutes >= closingMinutes) {
    throw new AppError('El horario del espacio no es válido', 400);
  }

  if (startMinutes < openingMinutes) {
    throw new AppError(
      `La reserva no puede comenzar antes de la apertura del espacio (${space.openingTime})`,
      400
    );
  }

  if (endMinutes > closingMinutes) {
    throw new AppError(
      `La reserva no puede terminar después del cierre del espacio (${space.closingTime})`,
      400
    );
  }
};

const findScheduleConflict = async (spaceId, start, end, excludeId = null) => {
  const query = {
    space: spaceId,
    status: { $in: BLOCKING_STATUSES },
    startDate: { $lt: end },
    endDate: { $gt: start },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Reservation.findOne(query);
};

const validateNoScheduleConflict = async (spaceId, start, end, excludeId = null) => {
  const conflict = await findScheduleConflict(spaceId, start, end, excludeId);

  if (conflict) {
    throw new AppError(
      'Ya existe una reserva pendiente o confirmada en ese horario para este espacio',
      409
    );
  }
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

const getSortOptions = (queryParams) => {
  const sortField = ALLOWED_SORT_FIELDS.includes(queryParams.sortBy)
    ? queryParams.sortBy
    : 'startDate';
  const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
  return { sortField, sortOrder };
};

const CSV_DELIMITER = ';';

const escapeCsvField = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);
  if (/[";\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

const formatDateForCsv = (date) => {
  if (!date) {
    return '';
  }

  return new Date(date).toISOString();
};

const reservationToCsvRow = (reservation) => {
  const space = reservation.space && typeof reservation.space === 'object' ? reservation.space : null;
  const creator =
    reservation.createdBy && typeof reservation.createdBy === 'object'
      ? reservation.createdBy
      : null;

  return [
    reservation._id.toString(),
    space?.name || '',
    space?.location || '',
    formatDateForCsv(reservation.startDate),
    formatDateForCsv(reservation.endDate),
    STATUS_LABELS[reservation.status] || reservation.status,
    reservation.clientName,
    reservation.clientEmail,
    reservation.attendees,
    creator?.name || '',
    formatDateForCsv(reservation.createdAt),
  ]
    .map(escapeCsvField)
    .join(CSV_DELIMITER);
};

const buildExportFilename = () => {
  const today = new Date().toISOString().slice(0, 10);
  return `reservas-${today}.csv`;
};

const exportReservationsCsv = async (queryParams) => {
  const { sortField, sortOrder } = getSortOptions(queryParams);
  const query = buildQuery(queryParams);

  const [reservations, total] = await Promise.all([
    Reservation.find(query).populate(populateOptions).sort({ [sortField]: sortOrder }),
    Reservation.countDocuments(query),
  ]);

  const rows = reservations.map(reservationToCsvRow);
  const csv = `\uFEFF${CSV_HEADERS.join(CSV_DELIMITER)}\n${rows.join('\n')}`;

  return {
    csv,
    filename: buildExportFilename(),
    total,
  };
};

const getReservations = async (queryParams) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const { sortField, sortOrder } = getSortOptions(queryParams);
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

  validateNotPastDate(start);
  validateWithinOpeningHours(start, end, spaceDoc);
  await validateNoScheduleConflict(space, start, end);

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

  const nextStartDate = data.startDate ?? reservation.startDate;
  const nextEndDate = data.endDate ?? reservation.endDate;
  const { start, end } = validateDates(nextStartDate, nextEndDate);

  if (data.startDate !== undefined) {
    updates.startDate = start;
  }
  if (data.endDate !== undefined) {
    updates.endDate = end;
  }

  validateNotPastDate(start);
  validateWithinOpeningHours(start, end, spaceDoc);
  await validateNoScheduleConflict(spaceId, start, end, reservation._id);

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
  exportReservationsCsv,
};
