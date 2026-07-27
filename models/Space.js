const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'El tipo es obligatorio'],
      enum: {
        values: ['sala', 'escritorio', 'sala_reuniones', 'phone_booth', 'otro'],
        message: 'Tipo de espacio no válido',
      },
    },
    location: {
      type: String,
      required: [true, 'La sede o ubicación es obligatoria'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'La capacidad es obligatoria'],
      min: [1, 'La capacidad debe ser al menos 1'],
    },
    openingTime: {
      type: String,
      required: [true, 'La hora de apertura es obligatoria'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'],
    },
    closingTime: {
      type: String,
      required: [true, 'La hora de cierre es obligatoria'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Space', spaceSchema);
