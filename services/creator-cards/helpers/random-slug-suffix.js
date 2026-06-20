const { randomBytes } = require('@app-core/randomness');

// 6-char random alphanumeric suffix appended to a slug when the base is too
// short or already taken. randomBytes(6) yields 6 hex chars (0-9a-f) — a valid
// alphanumeric, slug-safe value generated via the template's randomness util.
function randomSlugSuffix() {
  return randomBytes(6);
}

module.exports = randomSlugSuffix;
