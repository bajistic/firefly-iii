const { ensureValidToken } = require('../src/auth');

describe('ensureValidToken', () => {
  it('does not refresh if token is still valid', async () => {
    const validExpiry = Date.now() + 10 * 60 * 1000;
    const client = { credentials: { expiry_date: validExpiry } };
    const result = await ensureValidToken(client);
    expect(result).toBe(client);
  });

  it('refreshes token if expired', async () => {
    const expiredExpiry = Date.now() - 10 * 60 * 1000;
    const fakeNewCreds = { expiry_date: Date.now() + 10 * 60 * 1000 };
    const client = {
      credentials: { expiry_date: expiredExpiry },
      refreshAccessToken: jest.fn().mockResolvedValue({ credentials: fakeNewCreds }),
      setCredentials: jest.fn(),
    };
    const result = await ensureValidToken(client);
    expect(client.refreshAccessToken).toHaveBeenCalled();
    expect(client.setCredentials).toHaveBeenCalledWith(fakeNewCreds);
    expect(result).toBe(client);
  });
});