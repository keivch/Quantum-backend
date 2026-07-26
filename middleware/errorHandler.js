const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido',
    });
  }

  res.status(500).json({
    error: 'Error en el servidor',
    message: err.message,
  });
};

module.exports = errorHandler;
