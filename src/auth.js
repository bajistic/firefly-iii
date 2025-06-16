const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Token storage path
const TOKEN_PATH = path.join(__dirname, '../token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

// Load client credentials
async function loadCredentials() {
  try {
    const content = await fs.readFile(path.join(__dirname, '../credentials.json'));
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to read credentials.json: ${err.message}`);
  }
}

// Authenticate and return OAuth2 client
async function authenticate(app) {
  const credentials = await loadCredentials();

  // Check credential type
  if (credentials.type === 'service_account') {
    console.warn('WARNING: Service account credentials detected. This is not suitable for user calendar access. Please use OAuth 2.0 credentials (Web or Desktop app).');
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    });
    return auth.getClient();
  } else if (credentials.web || credentials.installed) {
    const creds = credentials.web || credentials.installed;
    const { client_secret, client_id, redirect_uris } = creds;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Set up token event listener to handle refresh tokens
    oAuth2Client.on('tokens', async (tokens) => {
      let existingTokens = {};

      try {
        // Load existing tokens
        const tokenContent = await fs.readFile(TOKEN_PATH);
        existingTokens = JSON.parse(tokenContent);
      } catch (error) {
        // No existing token file, that's okay
      }

      // Save new tokens, preserving the refresh_token if not provided in the new tokens
      const updatedTokens = {
        ...existingTokens,
        ...tokens
      };

      // Store the updated tokens
      await fs.writeFile(TOKEN_PATH, JSON.stringify(updatedTokens));
      console.log('Token updated and stored to', TOKEN_PATH);
    });

    try {
      // Check if we have a saved token
      const token = await fs.readFile(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
      console.log('Using existing token from', TOKEN_PATH);
      return oAuth2Client;
    } catch (err) {
      console.log('No token found, initiating OAuth flow');
      return await getNewToken(oAuth2Client, app);
    }
  } else {
    throw new Error('Invalid credentials.json: Expected "web", "installed", or "type: service_account".');
  }
}

// Get a new token by adding a callback endpoint to the main server
async function getNewToken(oAuth2Client, app) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    // Add this to force a new refresh token every time
    prompt: 'consent'
  });
  console.log('Authorize this app by visiting this URL:', authUrl);

  return new Promise((resolve, reject) => {
    app.get('/oauth2callback', async (req, res) => {
      const code = req.query.code;
      const error = req.query.error;

      if (error) {
        console.error(`OAuth error: ${error}`);
        res.status(400).send(`OAuth error: ${error}`);
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code) {
        console.error('No authorization code provided in callback');
        res.status(400).send('Error: No authorization code provided.');
        reject(new Error('No authorization code provided'));
        return;
      }

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Save token for future use
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log('Token stored to', TOKEN_PATH);

        res.send('Authorization successful! You can close this window.');
        resolve(oAuth2Client);
      } catch (err) {
        console.error(`Error during token exchange: ${err.message}`);
        res.status(500).send('Error during authorization: ' + err.message);
        reject(err);
      }
    });
  });
}


async function ensureValidToken(oAuth2Client, app) {
  const { expiry_date } = oAuth2Client.credentials;

  if (!expiry_date || expiry_date < Date.now() + 5 * 60 * 1000) {
    console.log('Token expired or close to expiry, refreshing...');

    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing token:', error);
      if ((error.response && error.response.data && error.response.data.error === 'invalid_grant') ||
          (error.message && error.message.includes('invalid_grant'))) {
        try { await fs.unlink(TOKEN_PATH); } catch {}
        return await getNewToken(oAuth2Client, app);
      }
      throw error;
    }
  }

  return oAuth2Client;
}

module.exports = { authenticate, ensureValidToken };
