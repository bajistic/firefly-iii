const { UnifiedActionSchema } = require('../src/zodschemas');

describe('UnifiedActionSchema', () => {
  it('accepts valid create_event action', () => {
    const valid = {
      action: 'create_event',
      summary: 'Meeting',
      startDateTime: '2023-01-01T10:00:00Z',
      endDateTime: '2023-01-01T11:00:00Z',
    };
    expect(UnifiedActionSchema.parse(valid)).toEqual(valid);
  });

  it('rejects create_event with missing fields', () => {
    const invalid = { action: 'create_event', summary: 'Meeting' };
    expect(() => UnifiedActionSchema.parse(invalid)).toThrow();
  });
  it('accepts valid scrape_jobs action', () => {
    const valid = {
      action: 'scrape_jobs',
      job_urls: ['https://example.com/job1', 'https://example.com/job2'],
    };
    expect(UnifiedActionSchema.parse(valid)).toEqual(valid);
  });
  it('accepts valid favorite_job action', () => {
    const valid = {
      action: 'favorite_job',
      job_id: 123,
    };
    expect(UnifiedActionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts valid send_email action', () => {
    const valid = {
      action: 'send_email',
      emails: [{
        to: 'alice@example.com',
        cc: ['bob@example.com'],
        bcc: [],
        subject: 'Hello',
        body: 'Test',
        attachments: []
      }]
    };
    expect(UnifiedActionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts valid list_messages action', () => {
    const valid = {
      action: 'list_messages',
      query: 'is:unread',
      max_results: 5
    };
    expect(UnifiedActionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts valid get_message action', () => {
    const valid = { action: 'get_message', message_id: 'XYZ123' };
    expect(UnifiedActionSchema.parse(valid)).toEqual(valid);
  });

  it('accepts valid modify_message action', () => {
    const valid = {
      action: 'modify_message',
      message_id: 'XYZ123',
      add_labels: ['IMPORTANT'],
      remove_labels: ['UNREAD']
    };
    expect(UnifiedActionSchema.parse(valid)).toEqual(valid);
  });
});