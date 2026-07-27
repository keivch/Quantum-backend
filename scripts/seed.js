require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const Space = require('../models/Space');
const Reservation = require('../models/Reservation');

const USERS = [
  {
    name: 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@quantum.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    role: 'admin',
  },
  {
    name: 'Operador',
    email: process.env.OPERATOR_EMAIL || 'operador@quantum.com',
    password: process.env.OPERATOR_PASSWORD || 'Operador123!',
    role: 'operator',
  },
];

const SPACES = [
  {
    name: 'Sala Norte',
    type: 'sala_reuniones',
    location: 'Piso 2 - Ala Norte',
    capacity: 12,
    openingTime: '08:00',
    closingTime: '20:00',
    active: true,
  },
  {
    name: 'Sala Sur',
    type: 'sala_reuniones',
    location: 'Piso 2 - Ala Sur',
    capacity: 8,
    openingTime: '08:00',
    closingTime: '20:00',
    active: true,
  },
  {
    name: 'Escritorio A1',
    type: 'escritorio',
    location: 'Piso 1 - Zona Abierta',
    capacity: 1,
    openingTime: '09:00',
    closingTime: '18:00',
    active: true,
  },
  {
    name: 'Escritorio B2',
    type: 'escritorio',
    location: 'Piso 1 - Zona Silenciosa',
    capacity: 1,
    openingTime: '09:00',
    closingTime: '18:00',
    active: true,
  },
  {
    name: 'Phone Booth 1',
    type: 'phone_booth',
    location: 'Piso 3',
    capacity: 1,
    openingTime: '08:00',
    closingTime: '19:00',
    active: true,
  },
];

const buildDate = (dayOffset, hour, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const buildReservations = (spaceIds, userIds) => {
  const [adminId, operatorId] = userIds;
  const [salaNorte, salaSur, escritorioA1, escritorioB2, phoneBooth] = spaceIds;

  return [
    {
      title: 'Kickoff proyecto Quantum',
      clientName: 'María López',
      clientEmail: 'maria.lopez@example.com',
      attendees: 8,
      space: salaNorte,
      startDate: buildDate(-24, 10),
      endDate: buildDate(-24, 12),
      status: 'completed',
      notes: 'Reunión de arranque con stakeholders.',
      createdBy: adminId,
    },
    {
      title: 'Daily equipo desarrollo',
      clientName: 'Carlos Ruiz',
      clientEmail: 'carlos.ruiz@example.com',
      attendees: 6,
      space: salaSur,
      startDate: buildDate(-20, 9),
      endDate: buildDate(-20, 9, 30),
      status: 'completed',
      createdBy: operatorId,
    },
    {
      title: 'Demo para cliente Acme',
      clientName: 'Ana Torres',
      clientEmail: 'ana.torres@acme.com',
      attendees: 10,
      space: salaNorte,
      startDate: buildDate(-18, 15),
      endDate: buildDate(-18, 17),
      status: 'confirmed',
      createdBy: adminId,
    },
    {
      title: 'Entrevista candidato UX',
      clientName: 'Laura Vega',
      clientEmail: 'laura.vega@example.com',
      attendees: 3,
      space: salaSur,
      startDate: buildDate(-15, 11),
      endDate: buildDate(-15, 12),
      status: 'cancelled',
      notes: 'Cancelada por reprogramación del candidato.',
      createdBy: operatorId,
    },
    {
      title: 'Sesión focus individual',
      clientName: 'Pedro Sánchez',
      clientEmail: 'pedro.sanchez@example.com',
      attendees: 1,
      space: escritorioA1,
      startDate: buildDate(-14, 9),
      endDate: buildDate(-14, 13),
      status: 'completed',
      createdBy: operatorId,
    },
    {
      title: 'Llamada con proveedor',
      clientName: 'Sofía Mendoza',
      clientEmail: 'sofia.mendoza@example.com',
      attendees: 1,
      space: phoneBooth,
      startDate: buildDate(-12, 16),
      endDate: buildDate(-12, 17),
      status: 'completed',
      createdBy: adminId,
    },
    {
      title: 'Workshop diseño de producto',
      clientName: 'Equipo Producto',
      clientEmail: 'producto@quantum.com',
      attendees: 7,
      space: salaNorte,
      startDate: buildDate(-10, 10),
      endDate: buildDate(-10, 13),
      status: 'confirmed',
      createdBy: adminId,
    },
    {
      title: 'Revisión sprint',
      clientName: 'Scrum Team Alpha',
      clientEmail: 'alpha@quantum.com',
      attendees: 5,
      space: salaSur,
      startDate: buildDate(-8, 14),
      endDate: buildDate(-8, 15, 30),
      status: 'confirmed',
      createdBy: operatorId,
    },
    {
      title: 'Capacitación interna',
      clientName: 'Recursos Humanos',
      clientEmail: 'rrhh@quantum.com',
      attendees: 12,
      space: salaNorte,
      startDate: buildDate(-7, 9),
      endDate: buildDate(-7, 11),
      status: 'cancelled',
      createdBy: adminId,
    },
    {
      title: 'Trabajo remoto presencial',
      clientName: 'Diego Herrera',
      clientEmail: 'diego.herrera@example.com',
      attendees: 1,
      space: escritorioB2,
      startDate: buildDate(-6, 10),
      endDate: buildDate(-6, 18),
      status: 'confirmed',
      createdBy: operatorId,
    },
    {
      title: 'Onboarding nuevo colaborador',
      clientName: 'Valentina Ríos',
      clientEmail: 'valentina.rios@example.com',
      attendees: 4,
      space: salaSur,
      startDate: buildDate(-5, 11),
      endDate: buildDate(-5, 12, 30),
      status: 'pending',
      createdBy: adminId,
    },
    {
      title: 'Sesión de mentoría',
      clientName: 'Jorge Castillo',
      clientEmail: 'jorge.castillo@example.com',
      attendees: 2,
      space: salaSur,
      startDate: buildDate(-3, 16),
      endDate: buildDate(-3, 17),
      status: 'confirmed',
      createdBy: operatorId,
    },
    {
      title: 'Planificación trimestral',
      clientName: 'Dirección',
      clientEmail: 'direccion@quantum.com',
      attendees: 8,
      space: salaNorte,
      startDate: buildDate(-2, 9),
      endDate: buildDate(-2, 12),
      status: 'pending',
      createdBy: adminId,
    },
    {
      title: 'Espacio de concentración',
      clientName: 'Camila Ortiz',
      clientEmail: 'camila.ortiz@example.com',
      attendees: 1,
      space: escritorioA1,
      startDate: buildDate(-1, 9),
      endDate: buildDate(-1, 12),
      status: 'completed',
      createdBy: operatorId,
    },
    {
      title: 'Reunión comercial',
      clientName: 'Felipe Gómez',
      clientEmail: 'felipe.gomez@cliente.com',
      attendees: 6,
      space: salaNorte,
      startDate: buildDate(0, 11),
      endDate: buildDate(0, 12, 30),
      status: 'confirmed',
      createdBy: adminId,
    },
    {
      title: 'Sync con marketing',
      clientName: 'Equipo Marketing',
      clientEmail: 'marketing@quantum.com',
      attendees: 4,
      space: salaSur,
      startDate: buildDate(1, 10),
      endDate: buildDate(1, 11),
      status: 'pending',
      createdBy: operatorId,
    },
    {
      title: 'Videollamada confidencial',
      clientName: 'Patricia Núñez',
      clientEmail: 'patricia.nunez@example.com',
      attendees: 1,
      space: phoneBooth,
      startDate: buildDate(2, 15),
      endDate: buildDate(2, 16),
      status: 'pending',
      createdBy: operatorId,
    },
    {
      title: 'Taller de innovación',
      clientName: 'Lab Quantum',
      clientEmail: 'lab@quantum.com',
      attendees: 10,
      space: salaNorte,
      startDate: buildDate(4, 14),
      endDate: buildDate(4, 17),
      status: 'confirmed',
      createdBy: adminId,
    },
    {
      title: 'Reserva de prueba cancelada',
      clientName: 'Cliente Demo',
      clientEmail: 'cliente.demo@example.com',
      attendees: 3,
      space: salaSur,
      startDate: buildDate(5, 9),
      endDate: buildDate(5, 10),
      status: 'cancelled',
      notes: 'Cancelada por cambio de agenda.',
      createdBy: operatorId,
    },
    {
      title: 'Jornada de trabajo flexible',
      clientName: 'Andrés Morales',
      clientEmail: 'andres.morales@example.com',
      attendees: 1,
      space: escritorioB2,
      startDate: buildDate(7, 9),
      endDate: buildDate(7, 17),
      status: 'pending',
      createdBy: operatorId,
    },
  ];
};

const ensureUsers = async () => {
  const userIds = [];

  for (const userData of USERS) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`Usuario ya existe: ${userData.email}`);
      userIds.push(existing._id);
      continue;
    }

    const user = await User.create({ ...userData, active: true });
    console.log(`Usuario creado: ${user.email} (${user.role})`);
    userIds.push(user._id);
  }

  return userIds;
};

const ensureSpaces = async () => {
  const spaceIds = [];

  for (const spaceData of SPACES) {
    const existing = await Space.findOne({ name: spaceData.name });
    if (existing) {
      console.log(`Espacio ya existe: ${spaceData.name}`);
      spaceIds.push(existing._id);
      continue;
    }

    const space = await Space.create(spaceData);
    console.log(`Espacio creado: ${space.name} (${space.type})`);
    spaceIds.push(space._id);
  }

  return spaceIds;
};

const ensureReservations = async (spaceIds, userIds) => {
  const existingCount = await Reservation.countDocuments();
  if (existingCount >= 20) {
    console.log(`Reservas ya cargadas (${existingCount} en total)`);
    return;
  }

  const reservations = buildReservations(spaceIds, userIds);
  await Reservation.insertMany(reservations);
  console.log(`${reservations.length} reservas de ejemplo creadas`);
};

const seed = async () => {
  await connectDB();

  const userIds = await ensureUsers();
  const spaceIds = await ensureSpaces();
  await ensureReservations(spaceIds, userIds);

  console.log('\nDatos iniciales listos.');
  console.log('Credenciales de prueba:');
  console.log(`  Admin:    ${USERS[0].email} / ${USERS[0].password}`);
  console.log(`  Operador: ${USERS[1].email} / ${USERS[1].password}`);

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
