const { google } = require('googleapis');
jest.mock('googleapis');

const { createEvent, listEvents, deleteEvent } = require('../src/calendar');

describe('calendar API wrappers', () => {
  let mockInsert, mockList, mockDelete;

  beforeEach(() => {
    mockInsert = jest.fn().mockResolvedValue({ data: { id: 'evt123', summary: 'Test Event' } });
    mockList = jest.fn().mockResolvedValue({ data: { items: [{ id: 'evt1' }] } });
    mockDelete = jest.fn().mockResolvedValue();
    const calendarInstance = { events: { insert: mockInsert, list: mockList, delete: mockDelete } };
    google.calendar = jest.fn().mockReturnValue(calendarInstance);
  });

  it('createEvent should insert an event and return data', async () => {
    const auth = {};
    const details = { summary: 'Test', startDateTime: '2023-01-01T00:00:00Z', endDateTime: '2023-01-01T01:00:00Z' };
    const result = await createEvent(auth, details);
    expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth });
    expect(mockInsert).toHaveBeenCalledWith({ calendarId: 'primary', resource: expect.objectContaining({ summary: 'Test' }) });
    expect(result).toEqual({ id: 'evt123', summary: 'Test Event' });
  });

  it('listEvents should list items', async () => {
    const auth = {};
    const items = await listEvents(auth, '2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z');
    expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth });
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ calendarId: 'primary', timeMin: '2023-01-01T00:00:00Z', timeMax: '2023-01-02T00:00:00Z' }));
    expect(items).toEqual([{ id: 'evt1' }]);
  });

  it('deleteEvent should delete and return success message', async () => {
    const auth = {};
    const result = await deleteEvent(auth, 'evt123');
    expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth });
    expect(mockDelete).toHaveBeenCalledWith({ calendarId: 'primary', eventId: 'evt123' });
    expect(result).toEqual({ success: true, message: 'Event evt123 deleted' });
  });
});