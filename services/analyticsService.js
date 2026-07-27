const Reservation = require('../models/Reservation');
const AppError = require('../utils/AppError');

const MS_PER_HOUR = 1000 * 60 * 60;

const parseDateRange = (startDateFrom, startDateTo) => {
  if (!startDateFrom || !startDateTo) {
    throw new AppError('startDateFrom y startDateTo son obligatorios', 400);
  }

  const start = new Date(startDateFrom);
  const end = new Date(startDateTo);
  end.setHours(23, 59, 59, 999);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Las fechas no son válidas', 400);
  }

  if (end < start) {
    throw new AppError('La fecha de fin debe ser posterior o igual a la fecha de inicio', 400);
  }

  return { start, end };
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDaySeries = (start, end, countsByDay) => {
  const series = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    const date = formatDateKey(cursor);
    series.push({
      date,
      count: countsByDay.get(date) || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
};

const getReservationAnalytics = async (queryParams) => {
  const { start, end } = parseDateRange(queryParams.startDateFrom, queryParams.startDateTo);

  const matchStage = {
    startDate: { $gte: start, $lte: end },
  };

  const [
    statusCounts,
    dailyCounts,
    confirmedBySpace,
    usageBySpace,
  ] = await Promise.all([
    Reservation.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Reservation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Reservation.aggregate([
      { $match: { ...matchStage, status: 'confirmed' } },
      { $group: { _id: '$space', confirmedCount: { $sum: 1 } } },
      { $sort: { confirmedCount: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'spaces',
          localField: '_id',
          foreignField: '_id',
          as: 'space',
        },
      },
      { $unwind: { path: '$space', preserveNullAndEmptyArrays: true } },
    ]),
    Reservation.aggregate([
      { $match: { ...matchStage, status: 'confirmed' } },
      {
        $project: {
          space: 1,
          durationHours: {
            $divide: [{ $subtract: ['$endDate', '$startDate'] }, MS_PER_HOUR],
          },
        },
      },
      {
        $group: {
          _id: '$space',
          confirmedHours: { $sum: '$durationHours' },
          confirmedCount: { $sum: 1 },
        },
      },
      { $sort: { confirmedHours: -1 } },
      {
        $lookup: {
          from: 'spaces',
          localField: '_id',
          foreignField: '_id',
          as: 'space',
        },
      },
      { $unwind: { path: '$space', preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  const statusMap = statusCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const totalReservations = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
  const confirmedCount = statusMap.confirmed || 0;
  const cancelledCount = statusMap.cancelled || 0;
  const cancellationRate =
    totalReservations > 0 ? Number((cancelledCount / totalReservations).toFixed(4)) : 0;

  const countsByDay = new Map(dailyCounts.map((item) => [item._id, item.count]));

  const topSpaceResult = confirmedBySpace[0];
  const topSpace = topSpaceResult
    ? {
        spaceId: String(topSpaceResult._id),
        name: topSpaceResult.space?.name || 'Espacio desconocido',
        confirmedCount: topSpaceResult.confirmedCount,
      }
    : null;

  const statusOrder = ['pending', 'confirmed', 'cancelled', 'completed'];
  const statusDistribution = statusOrder.map((status) => ({
    status,
    count: statusMap[status] || 0,
  }));

  return {
    period: {
      startDateFrom: start.toISOString(),
      startDateTo: end.toISOString(),
    },
    summary: {
      totalReservations,
      confirmedCount,
      cancelledCount,
      cancellationRate,
      topSpace,
    },
    reservationsByDay: buildDaySeries(start, end, countsByDay),
    statusDistribution,
    usageBySpace: usageBySpace.map((item) => ({
      spaceId: String(item._id),
      name: item.space?.name || 'Espacio desconocido',
      confirmedHours: Number(item.confirmedHours.toFixed(2)),
      confirmedCount: item.confirmedCount,
    })),
    usageMetric: {
      unit: 'hours',
      description:
        'Suma de horas entre inicio y fin de reservas confirmadas cuya fecha de inicio cae en el periodo seleccionado.',
    },
  };
};

module.exports = {
  getReservationAnalytics,
};
