// Exact response/error copy for the creator-cards service.
// Strings are verbatim from the assessment spec — do not paraphrase.
module.exports = {
  // Success
  CREATED: 'Creator Card Created Successfully.',
  RETRIEVED: 'Creator Card Retrieved Successfully.',
  DELETED: 'Creator Card Deleted Successfully.',

  // Business-rule errors (paired with assessment codes in throw-card-error.js)
  SLUG_TAKEN: 'Slug is already taken', // SL02
  ACCESS_CODE_REQUIRED_PRIVATE: 'access_code is required when access_type is private', // AC01
  ACCESS_CODE_ON_PUBLIC: 'access_code can only be set on private cards', // AC05
  NOT_FOUND: 'Creator card not found', // NF01 + NF02
  PRIVATE_ACCESS_CODE_REQUIRED: 'This card is private. An access code is required', // AC03
  INVALID_ACCESS_CODE: 'Invalid access code', // AC04
};
