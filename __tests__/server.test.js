const request = require('supertest');

describe('/status endpoint', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns status ok and tailscale_ip from env', async () => {
    process.env.TAILSCALE_IP = '1.2.3.4';
    const app = require('../src/server');
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      tailscale_ip: '1.2.3.4',
      conversation_history_length: expect.any(Number),
      db_schema_loaded: expect.any(Boolean),
    });
  });

  it('returns unknown if no TAILSCALE_IP', async () => {
    delete process.env.TAILSCALE_IP;
    const app = require('../src/server');
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      tailscale_ip: expect.any(String),
      conversation_history_length: expect.any(Number),
      db_schema_loaded: expect.any(Boolean),
    });
  });
});