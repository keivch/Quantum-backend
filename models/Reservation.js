const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    clientName: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    clientEmail: {
      type: String,
      required: [true, 'El correo del cliente es obligatorio'],
      trim: true,
      lowercase: true,
    },
    attendees: {
      type: Number,
      required: [true, 'El número de asistentes es obligatorio'],
      min: [1, 'Debe haber al menos 1 asistente'],
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: [true, 'El espacio es obligatorio'],
    },
    startDate: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria'],
    },
    endDate: {
      type: Date,
      required: [true, 'La fecha de fin es obligatoria'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

reservationSchema.index({ title: 'text', clientName: 'text', clientEmail: 'text' });
reservationSchema.index({ startDate: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ space: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
