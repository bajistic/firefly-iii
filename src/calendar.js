const { google } = require('googleapis');

async function createEvent(auth, eventDetails) {
  const calendar = google.calendar({ version: 'v3', auth });
  const event = {
    summary: eventDetails.summary || 'Untitled Event',
    description: eventDetails.description || '',
    start: {
      dateTime: eventDetails.startDateTime,
      timeZone: 'Europe/Zurich',
    },
    end: {
      dateTime: eventDetails.endDateTime,
      timeZone: 'Europe/Zurich',
    },
    location: eventDetails.location || '',
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    return response.data;
  } catch (err) {
    throw new Error(`Failed to create event: ${err.message}`);
  }
}

async function listEvents(auth, timeMin, timeMax) {
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items;
  } catch (err) {
    throw new Error(`Failed to list events: ${err.message}`);
  }
}

async function deleteEvent(auth, eventId) {
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return { success: true, message: `Event ${eventId} deleted` };
  } catch (err) {
    throw new Error(`Failed to delete event: ${err.message}`);
  }
}

module.exports = { createEvent, listEvents, deleteEvent };
