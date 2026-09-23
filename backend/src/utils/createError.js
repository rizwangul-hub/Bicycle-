/**
 * Creates a standardised HTTP error object.
 *
 * @param {number} statusCode - HTTP status code
 * @param {string} message    - Human-readable error message
 * @returns {Error}
 */
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { createError };
