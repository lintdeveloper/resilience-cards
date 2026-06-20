// Generate a base slug from a title WITHOUT regex (template rule):
// lowercase -> spaces to hyphens -> drop disallowed chars -> collapse repeated
// hyphens -> trim leading/trailing hyphens. Length and uniqueness/suffixing are
// handled by the caller (service), not here.
const ALLOWED = new Set('abcdefghijklmnopqrstuvwxyz0123456789-_'.split(''));

/**
 * @param {string} title
 * @returns {string} the base slug (may be shorter than the 5-char minimum)
 */
function slugifyTitle(title) {
  let response = '';
  if (typeof title === 'string') {
    // lowercase, then collapse any run of spaces into single hyphens
    const hyphenated = title.toLowerCase().split(' ').filter(Boolean).join('-');

    // keep only allowed characters
    const filtered = hyphenated
      .split('')
      .filter((char) => ALLOWED.has(char))
      .join('');

    // collapse consecutive hyphens
    const collapsed = filtered.split('').reduce((acc, char) => {
      if (char === '-' && acc.endsWith('-')) {
        return acc;
      }
      return acc + char;
    }, '');

    // trim leading/trailing hyphens
    let start = 0;
    let end = collapsed.length;
    while (start < end && collapsed[start] === '-') {
      start += 1;
    }
    while (end > start && collapsed[end - 1] === '-') {
      end -= 1;
    }
    response = collapsed.slice(start, end);
  }
  return response;
}

module.exports = slugifyTitle;
