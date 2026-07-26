require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');

const seedAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@quantum.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('El administrador ya existe');
    process.exit(0);
  }

  await User.create({
    name: 'Administrador',
    email,
    password,
    role: 'admin',
    active: true,
  });

  console.log(`Administrador creado: ${email}`);
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
