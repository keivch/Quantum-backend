const reservationService = require('../services/reservationService');

exports.getReservations = async (req, res, next) => {
  try {
    const result = await reservationService.getReservations(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getReservationById = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservationById(req.params.id);
    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

exports.createReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.createReservation(req.body, req.user._id);
    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};

exports.updateReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.updateReservation(req.params.id, req.body);
    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.cancelReservation(req.params.id);
    res.json(reservation);
  } catch (error) {
    next(error);
  }
};
