const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { CreatorCardMessages } = require('@app/messages');

// Single place that maps each assessment business code to (a) the template
// ERROR_CODE that drives the HTTP status and (b) its exact message. The code is
// passed via `context` and lifted to the TOP LEVEL of the response as `code`
// by core/express/server.js (see ADR 0005). Keeping this centralized means the
// response shape is changeable in one spot.
const CODE_MAP = {
  SL02: { errorCode: ERROR_CODE.INVLDDATA, message: CreatorCardMessages.SLUG_TAKEN }, // 400
  AC01: {
    errorCode: ERROR_CODE.INVLDDATA,
    message: CreatorCardMessages.ACCESS_CODE_REQUIRED_PRIVATE,
  }, // 400
  AC05: { errorCode: ERROR_CODE.INVLDDATA, message: CreatorCardMessages.ACCESS_CODE_ON_PUBLIC }, // 400
  NF01: { errorCode: ERROR_CODE.NOTFOUND, message: CreatorCardMessages.NOT_FOUND }, // 404
  NF02: { errorCode: ERROR_CODE.NOTFOUND, message: CreatorCardMessages.NOT_FOUND }, // 404
  AC03: {
    errorCode: ERROR_CODE.INVLDREQ,
    message: CreatorCardMessages.PRIVATE_ACCESS_CODE_REQUIRED,
  }, // 403
  AC04: { errorCode: ERROR_CODE.INVLDREQ, message: CreatorCardMessages.INVALID_ACCESS_CODE }, // 403
};

/**
 * Throw a creator-card business error by its assessment code.
 * @param {('SL02'|'AC01'|'AC05'|'NF01'|'NF02'|'AC03'|'AC04')} code
 */
function throwCardError(code) {
  const entry = CODE_MAP[code];
  if (!entry) {
    throwAppError(`Unknown creator-card error code: ${code}`, ERROR_CODE.APPERR);
  }
  throwAppError(entry.message, entry.errorCode, { context: { code } });
}

module.exports = throwCardError;
