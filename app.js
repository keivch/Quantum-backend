require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/spaces', require('./routes/spaceRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Servidor ejecutándose correctamente' });
});

app.use(errorHandler);

module.exports = app;
