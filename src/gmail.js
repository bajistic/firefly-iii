const { google } = require('googleapis');

/**
 * Send one or more emails via Gmail API.
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {object} emailData
 * @param {string} emailData.to
 * @param {string[]} [emailData.cc]
 * @param {string[]} [emailData.bcc]
 * @param {string} emailData.subject
 * @param {string} emailData.body
 * @param {string[]} [emailData.attachments]
 * @returns {Promise<object>} Gmail API response
 */
async function sendEmail(auth, emailData) {
  const gmail = google.gmail({ version: 'v1', auth });
  const { to, cc = [], bcc = [], subject, body } = emailData;
  const headers = [
    `To: ${to}`,
    ...(cc.length ? [`Cc: ${cc.join(', ')}`] : []),
    ...(bcc.length ? [`Bcc: ${bcc.join(', ')}`] : []),
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
  ];
  const message = headers.concat(body).join('\r\n');
  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });
  return res.data;
}

/**
 * List messages from the Gmail inbox matching a query.
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {string} query Gmail search query string
 * @param {number} maxResults maximum number of messages to return
 * @returns {Promise<object[]>} Array of message metadata
 */
async function listMessages(auth, query = '', maxResults = 10) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults
  });
  return res.data.messages || [];
}

/**
 * Retrieve a full message by ID.
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {string} messageId Gmail message ID
 * @returns {Promise<object>} Full message resource
 */
async function getMessage(auth, messageId) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });
  return res.data;
}

/**
 * Modify labels on a message (e.g., mark as read/unread or add/remove labels).
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {string} messageId Gmail message ID
 * @param {string[]} addLabels label IDs to add
 * @param {string[]} removeLabels label IDs to remove
 * @returns {Promise<object>} Gmail API modify response
 */
async function modifyMessage(auth, messageId, addLabels = [], removeLabels = []) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      addLabelIds: addLabels,
      removeLabelIds: removeLabels
    }
  });
  return res.data;
}

module.exports = { sendEmail, listMessages, getMessage, modifyMessage };