/* eslint-disable no-await-in-loop */
// Sequential slug-uniqueness checks are intentional (each depends on the prior),
// hence no-await-in-loop is disabled for this file.
const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCardRepository = require('@app/repository/creator-cards');
const slugifyTitle = require('./helpers/slugify-title');
const randomSlugSuffix = require('./helpers/random-slug-suffix');
const isValidSlugCharset = require('./helpers/is-valid-slug-charset');
const isValidAccessCode = require('./helpers/is-valid-access-code');
const serializeCard = require('./helpers/serialize-card');
const throwCardError = require('./helpers/throw-card-error');

// VSL handles type/length/enum/startsWith. Charset, conditionals, and uniqueness
// are business rules below (see docs/adr/0003).
const createSpec = validator.parse(`root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<trim|minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200|startsWith:http>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`);

const SLUG_MIN = 5;
const SLUG_MAX = 50;
const SUFFIX_LEN = 7; // '-' + 6 chars
const MAX_SLUG_ATTEMPTS = 5;

async function isSlugTaken(slug) {
  const existing = await CreatorCardRepository.findOne({ query: { slug } });
  return Boolean(existing);
}

function withSuffix(base) {
  const root = base ? base.slice(0, SLUG_MAX - SUFFIX_LEN) : 'card';
  return `${root}-${randomSlugSuffix()}`;
}

async function generateUniqueSlug(title) {
  const base = slugifyTitle(title).slice(0, SLUG_MAX);
  let candidate = base.length < SLUG_MIN ? withSuffix(base) : base;
  let attempts = 0;
  while (attempts < MAX_SLUG_ATTEMPTS && (await isSlugTaken(candidate))) {
    candidate = withSuffix(base);
    attempts += 1;
  }
  return candidate;
}

/**
 * Create a creator card.
 * @param {Object} serviceData - raw request body
 * @returns {Promise<Object>} the created card (serialized; includes access_code)
 */
async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, createSpec);

  data.access_type = data.access_type || 'public';

  // access_code conditional + charset
  if (data.access_type === 'private') {
    if (!data.access_code) {
      throwCardError('AC01');
    }
    if (!isValidAccessCode(data.access_code)) {
      throwAppError('access_code must be exactly 6 alphanumeric characters', ERROR_CODE.INVLDDATA);
    }
  } else if (data.access_code) {
    throwCardError('AC05');
  }

  // service_rates: non-empty rates + positive-integer amounts
  if (data.service_rates) {
    const { rates } = data.service_rates;
    if (!Array.isArray(rates) || rates.length === 0) {
      throwAppError('service_rates.rates must be a non-empty array', ERROR_CODE.INVLDDATA);
    }
    if (rates.some((rate) => !Number.isInteger(rate.amount) || rate.amount < 1)) {
      throwAppError('rate amount must be a positive integer in minor units', ERROR_CODE.INVLDDATA);
    }
  }

  // slug: validate charset + uniqueness, or auto-generate
  if (data.slug) {
    if (!isValidSlugCharset(data.slug)) {
      throwAppError(
        'slug may only contain letters, numbers, hyphens and underscores',
        ERROR_CODE.INVLDDATA
      );
    }
    if (await isSlugTaken(data.slug)) {
      throwCardError('SL02');
    }
  } else {
    data.slug = await generateUniqueSlug(data.title);
  }

  let created;
  try {
    created = await CreatorCardRepository.create(data);
  } catch (e) {
    if (e.errorCode === ERROR_CODE.DUPLRCRD) {
      throwCardError('SL02');
    }
    throw e;
  }

  return serializeCard(created, { includeAccessCode: true });
}

module.exports = createCreatorCard;
