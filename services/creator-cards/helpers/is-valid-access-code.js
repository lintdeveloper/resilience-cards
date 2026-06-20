// access_code check WITHOUT regex (template rule): exactly 6 alphanumeric chars.
const ALPHANUMERIC = new Set(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
);

/**
 * @param {string} code
 * @returns {boolean} true if exactly 6 chars and all alphanumeric
 */
function isValidAccessCode(code) {
  let response = false;
  if (typeof code === 'string' && code.length === 6) {
    response = code.split('').every((char) => ALPHANUMERIC.has(char));
  }
  return response;
}

module.exports = isValidAccessCode;
