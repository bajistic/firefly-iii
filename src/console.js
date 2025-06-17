const fs = require('fs');
const path = require('path');

// Path to the unified log file (all console logs and errors appended here)
const logFilePath = path.join(process.cwd(), 'error.log');

// Ensure the log file exists (create if not)
fs.open(logFilePath, 'a', (err, fd) => {
  if (err) {
    console.error('Failed to open log file:', err);
  } else {
    fs.close(fd, () => {});
  }
});

// Store the original console methods
const originalLog = console.log;
const originalError = console.error;

// Regex to strip ANSI color codes for file logging
const stripAnsiRegex = /\u001b\[[0-9;]*m/g;

// Helper to write log lines to file
function writeToFile(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => {
    if (typeof arg === 'string') {
      return arg;
    } else if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}\n${arg.stack}`;
    } else {
      return JSON.stringify(arg);
    }
  }).join(' ');
  const plain = message.replace(stripAnsiRegex, '');
  const line = `${timestamp} [${level}] ${plain}\n`;
  fs.appendFile(logFilePath, line, err => {
    if (err) originalError('Failed to write to log file:', err);
  });
}

// Override console.log with a new function that adds timestamp
console.log = function () {
  // Convert arguments to an array
  const args = Array.from(arguments);

  // Get current date
  const now = new Date();

  // Format the timestamp in Europe/Zurich time (manually adjusting for timezone)
  // Note: This is a simplified approach as JavaScript doesn't natively handle timezones well
  const options = {
    timeZone: 'Europe/Zurich',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  // Get formatted date without milliseconds
  let timestamp = now.toLocaleString('de-CH', options);

  // Add milliseconds
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  timestamp += `.${milliseconds}`;

  // If the first argument is a string, prefix it with timestamp
  if (typeof args[0] === 'string') {
    args[0] = `[31m${timestamp}:[39m ` + args[0];
  } else {
    // If the first argument is not a string, add timestamp as a separate first argument
    args.unshift(`[32m${timestamp}:[39m `);
  }

  // Call the original console.log with the modified arguments
  originalLog.apply(console, args);
  // Append to unified log file
  writeToFile('LOG', args);
};

// Override console.error to also timestamp and write to log file
console.error = function () {
  const args = Array.from(arguments);
  // Call the original console.error
  originalError.apply(console, args);
  // Append to unified log file
  writeToFile('ERROR', args);
};

module.exports = { originalLog };
