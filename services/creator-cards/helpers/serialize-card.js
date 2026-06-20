// Map a stored creator-card document to its API representation:
// - expose Mongo `_id` as `id` (never leak `_id`)
// - drop the mongoose `__v` version key
// - normalize `deleted` (paranoid default 0 / undefined) to null
// - include `access_code` only when asked (create/delete include it as
//   null|value; GET omits it entirely)

/**
 * @param {Object} card - lean document (or mongoose doc)
 * @param {{ includeAccessCode?: boolean }} [options]
 * @returns {Object|null}
 */
function serializeCard(card, options = {}) {
  let response = null;
  if (card) {
    const source = card._doc || card;
    const cleaned = { ...source };
    const accessCode = cleaned.access_code;

    delete cleaned._id;
    delete cleaned.__v;
    delete cleaned.access_code;
    delete cleaned.deleted;

    response = {
      id: source._id,
      ...cleaned,
      deleted: source.deleted ? source.deleted : null,
    };

    if (options.includeAccessCode) {
      response.access_code = accessCode === undefined ? null : accessCode;
    }
  }
  return response;
}

module.exports = serializeCard;
