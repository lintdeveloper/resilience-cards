const validator = require('@app-core/validator');
const CreatorCardRepository = require('@app/repository/creator-cards');
const serializeCard = require('./helpers/serialize-card');
const throwCardError = require('./helpers/throw-card-error');

// creator_reference is validated for presence + length only; deletion is by slug
// (no match gate — the spec defines no mismatch behaviour). See docs/specs/delete-card.md.
const deleteSpec = validator.parse(`root {
  slug string<trim>
  creator_reference string<length:20>
}`);

/**
 * Soft-delete a card by slug.
 * @param {{ slug: string, creator_reference: string }} serviceData
 * @returns {Promise<Object>} the deleted card (serialized; includes access_code + deleted ts)
 */
async function deleteCreatorCard(serviceData) {
  const data = validator.validate(serviceData, deleteSpec);

  const card = await CreatorCardRepository.findOne({ query: { slug: data.slug } });
  if (!card) {
    throwCardError('NF01');
  }

  await CreatorCardRepository.deleteOne({ query: { slug: data.slug } });

  const response = serializeCard(card, { includeAccessCode: true });
  response.deleted = Date.now();
  return response;
}

module.exports = deleteCreatorCard;
