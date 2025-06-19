const fs = require('fs');
const path = require('path');

// Logging configuration
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO'; // DEBUG, INFO, WARN, ERROR
const VERBOSE_LOGGING = process.env.VERBOSE_LOGGING === 'true';

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

// Log level priorities
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Helper to determine if message should be logged based on verbosity
function shouldLog(message) {
  if (VERBOSE_LOGGING) return true;
  
  // Skip verbose debug messages in non-verbose mode
  const skipPatterns = [
    /OpenAI Action Response/,
    /Parsed Args/,
    /AI Decision \(Validated\)/,
    /Results before serialization/,
    /Sanitized results for interpreter/,
    /Using existing token from/,
    /Token expired or close to expiry/,
    /Token refreshed successfully/,
    /Token updated and stored/,
    /🔍 Gmail query:/,
    /📭 No new receipt emails found/
  ];
  
  return !skipPatterns.some(pattern => pattern.test(message));
}

// Helper to write log lines to file
function writeToFile(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
  const plain = message.replace(stripAnsiRegex, '');
  
  // Check if this message should be logged
  if (!shouldLog(plain)) return;
  
  const line = `${timestamp} [${level}] ${plain}\n`;
  fs.appendFile(logFilePath, line, err => {
    if (err) originalError('Failed to write to log file:', err);
  });
}

// Override console.log with a new function that adds timestamp
console.log = function () {
  // Convert arguments to an array
  const args = Array.from(arguments);
  const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');

  // Check if this message should be displayed to console in non-verbose mode
  if (!VERBOSE_LOGGING && !shouldLog(message)) {
    // Still write to file but skip console output
    writeToFile('LOG', args);
    return;
  }

  // Call the original console.log with the unmodified arguments (no timestamp in console)
  originalLog.apply(console, args);
  
  // Append to unified log file (with timestamp)
  writeToFile('LOG', args);
};

// Override console.error to also timestamp and write to log file
console.error = function () {
  const args = Array.from(arguments);
  
  // Call the original console.error (no timestamp in console)
  originalError.apply(console, args);
  
  // Append to unified log file (with timestamp)
  writeToFile('ERROR', args);
};

module.exports = { originalLog };