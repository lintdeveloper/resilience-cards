// Slug charset check WITHOUT regex (template rule): letters, numbers, '-', '_'.
const ALLOWED = new Set(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'.split('')
);

/**
 * @param {string} slug
 * @returns {boolean} true if non-empty and every char is allowed
 */
function isValidSlugCharset(slug) {
  let response = false;
  if (typeof slug === 'string' && slug.length > 0) {
    response = slug.split('').every((char) => ALLOWED.has(char));
  }
  return response;
}

module.exports = isValidSlugCharset;
