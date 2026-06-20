const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-cards');
const serializeCard = require('./helpers/serialize-card');
const throwCardError = require('./helpers/throw-card-error');

// slug comes from the path param; access_code (optional) from the query string.
// Kept permissive so a non-existent-but-otherwise-valid slug yields NF01, not a
// 400 — existence/draft/access checks are the real gates below.
const getSpec = validator.parse(`root {
  slug string<trim>
  access_code? string<trim>
}`);

/**
 * Public retrieval. Enforces existence -> draft -> private-access in strict order.
 * @param {{ slug: string, access_code?: string }} serviceData
 * @returns {Promise<Object>} the card (serialized; access_code omitted)
 */
async function getCreatorCard(serviceData) {
  const data = validator.validate(serviceData, getSpec);

  const card = await CreatorCardRepository.findOne({ query: { slug: data.slug } });

  if (!card) {
    throwCardError('NF01');
  }
  if (card.status === 'draft') {
    throwCardError('NF02');
  }
  if (card.access_type === 'private') {
    if (!data.access_code) {
      throwCardError('AC03');
    }
    if (data.access_code !== card.access_code) {
      throwCardError('AC04');
    }
  }

  return serializeCard(card, { includeAccessCode: false });
}

module.exports = getCreatorCard;
