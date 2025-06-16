const { google } = require('googleapis');
const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');
const { authenticate, ensureValidToken } = require('./auth'); // Reuse existing auth module

// Template ID for the Google Docs cover letter
const TEMPLATE_ID = '1_kZWhfedQ0KguiMFmMuToJYsPsdLJjubdtwInoPCPl8';

// Scopes for Google Docs and Drive APIs
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
];

// Base directory for finding client_secret.json
const BASE = path.dirname(__filename);
const SECRET = path.join(BASE, 'client_secret.json');
const TOKEN_PATH = path.join(BASE, 'token.json');

// Regular expressions for YAML extraction
const CODE_FENCE = /```(?:ya?ml?)?\s*\n(.*?)\n```/is;
const FRONTMATTER = /^---\s*\n(.*?)\n---/ms;

// Load or refresh Google API credentials
async function loadCredentials(app) {
  try {
    const auth = await authenticate(app);
    return await ensureValidToken(auth, app);
  } catch (err) {
    throw new Error(`Failed to load credentials: ${err.message}`);
  }
}

// Parse YAML from string or file
async function readPayload(src, isFile = false) {
  let text;
  if (isFile) {
    try {
      text = await fs.readFile(src, 'utf8');
    } catch (err) {
      throw new Error(`Failed to read file ${src}: ${err.message}`);
    }
  } else {
    text = src;
  }

  // Try parsing as pure YAML
  try {
    const data = yaml.load(text);
    if (typeof data === 'object' && data !== null) {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k.toUpperCase(), v])
      );
    }
  } catch (err) {
    // Not pure YAML, try other formats
  }

  // Try extracting from code fence
  const codeFenceMatch = text.match(CODE_FENCE);
  if (codeFenceMatch) {
    const block = codeFenceMatch[1].trim();
    try {
      const data = yaml.load(block);
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k.toUpperCase(), v])
      );
    } catch (err) {
      throw new Error(`YAML syntax error in code block: ${err.message}`);
    }
  }

  // Try extracting from frontmatter
  const frontmatterMatch = text.match(FRONTMATTER);
  if (frontmatterMatch) {
    const block = frontmatterMatch[1].trim();
    try {
      const data = yaml.load(block);
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k.toUpperCase(), v])
      );
    } catch (err) {
      throw new Error(`YAML syntax error in frontmatter: ${err.message}`);
    }
  }

  throw new Error(
    'No valid YAML found. Provide either:\n' +
    '1. Pure YAML string/file\n' +
    '2. Markdown with ```yaml ... ``` code block\n' +
    '3. Markdown with --- ... --- frontmatter'
  );
}

// Copy the Google Docs template
async function copyTemplate(drive, companyName) {
  const safeCompany = companyName.replace(/[\/\\]/g, '_').slice(0, 97) + (companyName.length > 100 ? '...' : '');
  const docName = `B.Bayarsaikhan_Schreiben_${safeCompany}`;

  try {
    const result = await drive.files.copy({
      fileId: TEMPLATE_ID,
      requestBody: { name: docName },
    });
    return result.data.id;
  } catch (err) {
    throw new Error(`Failed to copy template: ${err.message}`);
  }
}

// Build replacement requests for Google Docs
function buildRequests(replacements) {
  return Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: `{{${key.toUpperCase()}}}`, matchCase: true },
      replaceText: String(value),
    },
  }));
}

// Main function to create a cover letter
async function createCoverLetter(app, payload, options = {}) {
  console.log('payload cl', payload);
  const { src, isFile = false, labelReady = false } = payload;
  const { readyFolderId = '1BhQ06TRK0YT5YoSYfKmTILmueRgg3kct' } = options;

  try {
    // Get company name for file naming
    const companyName = src.suffix || 'Unknown';

    // Authenticate and ensure token is valid
    const auth = await loadCredentials(app);
    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    // Copy template
    const fileId = await copyTemplate(drive, companyName);

    // Replace placeholders
    const requests = buildRequests(src);
    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: { requests },
    });

    // Move to ReadyToSend folder if specified
    if (labelReady) {
      await drive.files.update({
        fileId,
        addParents: readyFolderId,
        removeParents: '',
        fields: 'id, parents',
      });
    }

    const url = `https://docs.google.com/document/d/${fileId}/edit`;
    return { success: true, message: `Created cover letter for ${companyName}`, url };
  } catch (err) {
    return { success: false, error: `Failed to create cover letter: ${err.message}` };
  }
}

module.exports = { createCoverLetter };
