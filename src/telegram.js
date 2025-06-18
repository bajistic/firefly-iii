const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const FormData = require('form-data'); // npm install form-data
const TAILSCALE_IP = process.env.TAILSCALE_IP || getTailscaleIP() || 'unknown'; // Fallback to dynamic IP or 'unknown'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const PORT = process.env.PORT || 3000;
const os = require('os');

function getTailscaleIP() {
  const interfaces = os.networkInterfaces();
  for (const iface in interfaces) {
    for (const addr of interfaces[iface]) {
      if (addr.address.startsWith('100.')) {
        return addr.address; // Return first Tailscale IP (e.g., 100.115.178.34)
      }
    }
  }
  return null; // No Tailscale IP found
};


if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not found in .env. Bot cannot start.");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log("\x1b[32m[BOT]\x1b[0m Telegram Bot started and polling for messages...");


// Telegram Bot: Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Hello! I’m your AI assistant. Send me a command or an image, and I’ll process it!'
  );
  console.log(`\x1b[34m[BOT]\x1b[0m /start command received from chatId: ${chatId}`);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Ignore commands (unless you want to handle more like /help)
  if (userMessage && userMessage.startsWith('/')) {
    // If it's not /start (already handled), maybe send a help message or ignore
    if (userMessage !== '/start') {
      // bot.sendMessage(chatId, "I only understand direct messages or /start.");
    }
    return;
  }

  // Handle text messages
  if (userMessage) {
    console.log(`\x1b[34m[BOT]\x1b[0m Message from chatId ${chatId}: "${userMessage}"`);
    try {
      await bot.sendChatAction(chatId, 'typing');

      const formData = new FormData();
      formData.append('command', userMessage);

      console.log(`\x1b[34m[BOT]\x1b[0m Attempting to POST to: http://${TAILSCALE_IP}:${PORT}/ai/natural`); // <<< ADD THIS LOG

      // Make a POST request to your own /ai/natural endpoint
      const response = await axios.post(
        // `http://${TAILSCALE_IP}:${PORT}/ai/natural`,
        `http://localhost:${PORT}/ai/natural`,
        formData,
        {
          headers: {
            ...formData.getHeaders(), // Important for multipart/form-data
            'X-Telegram-Origin': 'true' // <<< Custom header
          },
          timeout: 30000 // Good to have a timeout
        }
      );

      console.log(`\x1b[32m[BOT]\x1b[0m Response from API for chatId ${chatId}: "${response.data.message}"`);
      bot.sendMessage(chatId, response.data.message || 'Action processed.', { parse_mode: 'Markdown' });

    } catch (error) {
      let errorMessage = 'Sorry, something went wrong processing your text message.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      console.error(`\x1b[31m[BOT-ERR]\x1b[0m Error processing text message for chatId ${chatId}:`, error.message);
      bot.sendMessage(chatId, errorMessage);
    }
  }
  // Handle photo messages (receipts)
  else if (msg.photo) {
    console.log(`\x1b[34m[BOT]\x1b[0m Photo received from chatId ${chatId}`);
    try {
      await bot.sendChatAction(chatId, 'typing');

      const formData = new FormData();
      // If there's a caption with the photo, use it as the command
      const commandFromCaption = msg.caption || "Process this image";
      formData.append('command', commandFromCaption);
      console.log(`\x1b[34m[BOT]\x1b[0m Using command for photo: "${commandFromCaption}"`);


      // Get the largest photo (last in the array is usually highest res)
      // Telegram sends multiple sizes. msg.photo[msg.photo.length - 1] is largest.
      // msg.photo[0] is smallest.
      const photoMeta = msg.photo[msg.photo.length - 1];
      const fileStream = bot.getFileStream(photoMeta.file_id);

      // Append the file stream to FormData
      // You need to give it a filename for multer on the server to process it.
      formData.append('image', fileStream, { filename: `telegram-image-${Date.now()}.jpg` });


      const response = await axios.post(
        // `http://${TAILSCALE_IP}:${PORT}/ai/natural`,
        `http://localhost:${PORT}/ai/natural`,
        formData,
        {
          headers: {
            ...formData.getHeaders(), // formData will set the Content-Type
            'X-Telegram-Origin': 'true' // <<< Custom header
          }
        }
      );
      console.log(`\x1b[32m[BOT]\x1b[0m Response from API for photo for chatId ${chatId}: "${response.data.message}"`);
      bot.sendMessage(chatId, response.data.message || 'Image processed.', { parse_mode: 'Markdown' });

    } catch (error) {
      let errorMessage = 'Sorry, something went wrong processing your image.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      console.error(`\x1b[31m[BOT-ERR]\x1b[0m Error processing photo for chatId ${chatId}:`, error.message);
      bot.sendMessage(chatId, errorMessage);
    }
  }
  // Handle PDF documents (receipts)
  else if (msg.document && msg.document.mime_type === 'application/pdf') {
    console.log(`\x1b[34m[BOT]\x1b[0m PDF document received from chatId ${chatId}`);
    try {
      await bot.sendChatAction(chatId, 'typing');

      const formData = new FormData();
      // If there's a caption with the PDF, use it as the command
      const commandFromCaption = msg.caption || "Process this PDF receipt";
      formData.append('command', commandFromCaption);
      console.log(`\x1b[34m[BOT]\x1b[0m Using command for PDF: "${commandFromCaption}"`);

      // Get the PDF file stream
      const docMeta = msg.document;
      const fileStream = bot.getFileStream(docMeta.file_id);

      // Append the file stream to FormData
      const filename = docMeta.file_name || `telegram-receipt-${Date.now()}.pdf`;
      formData.append('image', fileStream, { filename });

      const response = await axios.post(
        `http://localhost:${PORT}/ai/natural`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'X-Telegram-Origin': 'true'
          },
          timeout: 45000 // PDFs might take longer to process
        }
      );

      console.log(`\x1b[32m[BOT]\x1b[0m Response from API for PDF for chatId ${chatId}: "${response.data.message}"`);
      bot.sendMessage(chatId, response.data.message || 'PDF receipt processed.', { parse_mode: 'Markdown' });

    } catch (error) {
      let errorMessage = 'Sorry, something went wrong processing your PDF receipt.';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = `Error: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      console.error(`\x1b[31m[BOT-ERR]\x1b[0m Error processing PDF for chatId ${chatId}:`, error.message);
      bot.sendMessage(chatId, errorMessage);
    }
  } else {
    // Handle other message types or ignore
    console.log(`\x1b[34m[BOT]\x1b[0m Received unhandled message type from chatId ${chatId}:`, msg);
    // bot.sendMessage(chatId, "I can process text messages, photos, and PDF receipts.");
  }
});

// Handle polling errors to prevent bot from crashing
bot.on('polling_error', (error) => {
  console.error(`\x1b[31m[BOT-POLL-ERR]\x1b[0m Polling error: ${error.code} - ${error.message}`);
  // You might want to implement more robust error handling or re-initialization logic here
  // For now, just log it. Some errors might be transient network issues.
});

console.log("\x1b[32m[BOT]\x1b[0m Telegram bot event handlers set up.");

module.exports = { bot };
