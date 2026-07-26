const request = require('supertest');
const app = require('../app');
const {
  createTestUser,
  getAuthToken,
  createTestSpace,
  buildReservationWindow,
  buildReservationPayload,
} = require('./helpers');

describe('Reservas API', () => {
  let authToken;
  let space;

  beforeEach(async () => {
    const user = await createTestUser();
    authToken = getAuthToken(user._id);
    space = await createTestSpace();
  });

  describe('autenticación', () => {
    it('rechaza el acceso a una ruta protegida sin token', async () => {
      const response = await request(app).get('/api/reservations');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No autorizado');
    });

    it('permite el acceso a una ruta protegida con token válido', async () => {
      const response = await request(app)
        .get('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('conflictos de horario', () => {
    it('rechaza una reserva superpuesta con 409 Conflict', async () => {
      const firstWindow = buildReservationWindow({ startHour: 10, durationHours: 2 });
      const overlappingWindow = buildReservationWindow({ startHour: 11, durationHours: 2 });

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buildReservationPayload(space._id, firstWindow))
        .expect(201);

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buildReservationPayload(space._id, overlappingWindow, { title: 'Segunda reserva' }));

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/ya existe una reserva/i);
    });

    it('permite dos reservas consecutivas en el mismo espacio', async () => {
      const firstWindow = buildReservationWindow({ startHour: 10, durationHours: 2 });
      const consecutiveWindow = buildReservationWindow({ startHour: 12, durationHours: 2 });

      const firstResponse = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buildReservationPayload(space._id, firstWindow));

      const secondResponse = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(
          buildReservationPayload(space._id, consecutiveWindow, { title: 'Reserva consecutiva' })
        );

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(201);
      expect(new Date(firstResponse.body.endDate).getTime()).toBe(
        new Date(secondResponse.body.startDate).getTime()
      );
    });
  });

  describe('validaciones de negocio', () => {
    it('rechaza una reserva que supera la capacidad del espacio', async () => {
      const window = buildReservationWindow();

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buildReservationPayload(space._id, window, { attendees: 15 }));

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/capacidad/i);
    });

    it('rechaza una reserva fuera del horario de apertura del espacio', async () => {
      const window = buildReservationWindow({ startHour: 7, durationHours: 1 });

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buildReservationPayload(space._id, window));

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/apertura/i);
    });

    it('rechaza una reserva con fecha de inicio en el pasado', async () => {
      const pastStart = new Date();
      pastStart.setDate(pastStart.getDate() - 1);
      pastStart.setHours(10, 0, 0, 0);

      const pastEnd = new Date(pastStart);
      pastEnd.setHours(12, 0, 0, 0);

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(
          buildReservationPayload(space._id, {
            startDate: pastStart.toISOString(),
            endDate: pastEnd.toISOString(),
          })
        );

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/fechas pasadas/i);
    });

    it('rechaza una reserva cuya fecha de fin no es posterior a la de inicio', async () => {
      const window = buildReservationWindow();

      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(
          buildReservationPayload(space._id, {
            startDate: window.endDate,
            endDate: window.startDate,
          })
        );

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/posterior/i);
    });
  });

  describe('exportación CSV', () => {
    it('rechaza la exportación sin token', async () => {
      const response = await request(app).get('/api/reservations/export');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No autorizado');
    });

    it('exporta reservas en CSV con encabezados y metadatos correctos', async () => {
      const window = buildReservationWindow();

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buildReservationPayload(space._id, window))
        .expect(201);

      const response = await request(app)
        .get('/api/reservations/export')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/csv/i);
      expect(response.headers['content-disposition']).toMatch(/attachment; filename="reservas-\d{4}-\d{2}-\d{2}\.csv"/);
      expect(response.headers['x-total-count']).toBe('1');
      expect(response.text.startsWith('\uFEFF')).toBe(true);

      const csv = response.text.replace(/^\uFEFF/, '');
      const [headerLine, dataLine] = csv.split('\n');

      expect(headerLine).toBe(
        'Identificador;Espacio;Sede;Inicio;Fin;Estado;Cliente;Correo;Asistentes;Usuario creador;Fecha de creación'
      );
      expect(dataLine).toContain('Sala Norte');
      expect(dataLine).toContain('Piso 2');
      expect(dataLine).toContain('Cliente Demo');
      expect(dataLine).toContain('cliente@example.com');
      expect(dataLine).toContain('Pendiente');
    });

    it('aplica los mismos filtros que el listado y exporta todos los resultados', async () => {
      const pendingWindow = buildReservationWindow({ startHour: 10, durationHours: 2 });
      const confirmedWindow = buildReservationWindow({ startHour: 14, durationHours: 2 });

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(buildReservationPayload(space._id, pendingWindow, { status: 'pending' }))
        .expect(201);

      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(
          buildReservationPayload(space._id, confirmedWindow, {
            title: 'Reserva confirmada',
            status: 'confirmed',
          })
        )
        .expect(201);

      const listResponse = await request(app)
        .get('/api/reservations')
        .query({ status: 'confirmed', limit: 1, page: 1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const exportResponse = await request(app)
        .get('/api/reservations/export')
        .query({ status: 'confirmed' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(listResponse.body.pagination.total).toBe(1);
      expect(exportResponse.headers['x-total-count']).toBe('1');

      const csv = exportResponse.text.replace(/^\uFEFF/, '');
      const dataLines = csv.split('\n').slice(1).filter(Boolean);

      expect(dataLines).toHaveLength(1);
      expect(dataLines[0]).toContain('Confirmado');
      expect(dataLines[0]).toContain('Cliente Demo');
    });
  });
});
