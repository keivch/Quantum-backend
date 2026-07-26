const request = require('supertest');
const app = require('../app');
const {
  createTestUser,
  getAuthToken,
  createTestSpace,
  buildReservationWindow,
  buildReservationPayload,
} = require('./helpers');

describe('Espacios API - desactivación', () => {
  let adminToken;
  let space;

  beforeEach(async () => {
    const admin = await createTestUser({ email: 'admin@quantum.com', role: 'admin' });
    adminToken = getAuthToken(admin._id);
    space = await createTestSpace();
  });

  it('desactiva un espacio sin reservas futuras', async () => {
    const response = await request(app)
      .patch(`/api/spaces/${space._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.active).toBe(false);
  });

  it('bloquea la desactivación si hay reservas futuras activas', async () => {
    const operator = await createTestUser({ email: 'operador2@quantum.com' });
    const operatorToken = getAuthToken(operator._id);
    const window = buildReservationWindow();

    await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(buildReservationPayload(space._id, window))
      .expect(201);

    const response = await request(app)
      .patch(`/api/spaces/${space._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/gestiona o cancela esas reservas/i);
    expect(response.body.error).toMatch(/1 reserva futura/i);
  });

  it('permite desactivar si solo hay reservas futuras canceladas', async () => {
    const operator = await createTestUser({ email: 'operador3@quantum.com' });
    const operatorToken = getAuthToken(operator._id);
    const window = buildReservationWindow();

    const createResponse = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(buildReservationPayload(space._id, window))
      .expect(201);

    await request(app)
      .patch(`/api/reservations/${createResponse.body._id}/cancel`)
      .set('Authorization', `Bearer ${operatorToken}`)
      .expect(200);

    const response = await request(app)
      .patch(`/api/spaces/${space._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.active).toBe(false);
  });
});
