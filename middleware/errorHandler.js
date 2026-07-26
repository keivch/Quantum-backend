const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages[0] || 'Error de validación' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ error: 'El correo ya está registrado' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Recurso no encontrado' });
  }

  res.status(500).json({ error: 'Error en el servidor' });
};

module.exports = errorHandler;
