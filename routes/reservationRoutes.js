const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', reservationController.getReservations);
router.get('/export', reservationController.exportReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.patch('/:id/cancel', reservationController.cancelReservation);

module.exports = router;
