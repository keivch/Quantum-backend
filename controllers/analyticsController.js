const analyticsService = require('../services/analyticsService');

exports.getReservationAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getReservationAnalytics(req.query);
    res.json(analytics);
  } catch (error) {
    next(error);
  }
};
