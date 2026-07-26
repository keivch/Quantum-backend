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
});
