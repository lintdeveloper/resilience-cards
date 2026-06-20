const { expect } = require('chai');
const { ERROR_CODE } = require('@app-core/errors');

const isValidSlugCharset = require('@app/services/creator-cards/helpers/is-valid-slug-charset');
const isValidAccessCode = require('@app/services/creator-cards/helpers/is-valid-access-code');
const slugifyTitle = require('@app/services/creator-cards/helpers/slugify-title');
const randomSlugSuffix = require('@app/services/creator-cards/helpers/random-slug-suffix');
const serializeCard = require('@app/services/creator-cards/helpers/serialize-card');
const throwCardError = require('@app/services/creator-cards/helpers/throw-card-error');

describe('creator-cards helpers', () => {
  describe('isValidSlugCharset', () => {
    it('accepts letters, numbers, hyphen, underscore', () => {
      expect(isValidSlugCharset('george-cooks')).to.equal(true);
      expect(isValidSlugCharset('A_b-1Z')).to.equal(true);
    });
    it('rejects spaces, symbols, empty, and non-strings', () => {
      expect(isValidSlugCharset('has space')).to.equal(false);
      expect(isValidSlugCharset('with!')).to.equal(false);
      expect(isValidSlugCharset('')).to.equal(false);
      expect(isValidSlugCharset(123)).to.equal(false);
    });
  });

  describe('isValidAccessCode', () => {
    it('accepts exactly 6 alphanumeric chars', () => {
      expect(isValidAccessCode('A1B2C3')).to.equal(true);
      expect(isValidAccessCode('abc123')).to.equal(true);
    });
    it('rejects wrong length or non-alphanumeric', () => {
      expect(isValidAccessCode('A1B2C')).to.equal(false);
      expect(isValidAccessCode('A1B2C3D')).to.equal(false);
      expect(isValidAccessCode('A1B2C!')).to.equal(false);
      expect(isValidAccessCode(undefined)).to.equal(false);
    });
  });

  describe('slugifyTitle', () => {
    it('lowercases and hyphenates spaces', () => {
      expect(slugifyTitle('George Cooks')).to.equal('george-cooks');
    });
    it('collapses repeated spaces and trims', () => {
      expect(slugifyTitle('  Multiple   Spaces  ')).to.equal('multiple-spaces');
    });
    it('drops disallowed characters (no regex)', () => {
      expect(slugifyTitle('Hi!!! There?')).to.equal('hi-there');
    });
    it('preserves underscores and trims stray hyphens', () => {
      expect(slugifyTitle('--a_b--')).to.equal('a_b');
    });
    it('returns empty string for non-strings', () => {
      expect(slugifyTitle(null)).to.equal('');
    });
  });

  describe('randomSlugSuffix', () => {
    it('returns a 6-char alphanumeric string', () => {
      const suffix = randomSlugSuffix();
      expect(suffix).to.be.a('string').with.lengthOf(6);
      expect(isValidSlugCharset(suffix)).to.equal(true);
    });
  });

  describe('serializeCard', () => {
    const base = {
      _id: '01JG8XYZA2B3C4D5E6F7G8H9J0',
      __v: 0,
      title: 'George Cooks',
      slug: 'george-cooks',
      access_code: null,
      status: 'published',
      access_type: 'public',
      created: 1767052800000,
      updated: 1767052800000,
      deleted: 0,
    };

    it('maps _id to id and drops _id/__v', () => {
      const out = serializeCard(base);
      expect(out.id).to.equal(base._id);
      expect(out).to.not.have.property('_id');
      expect(out).to.not.have.property('__v');
    });
    it('normalizes deleted 0 to null, keeps a real timestamp', () => {
      expect(serializeCard(base).deleted).to.equal(null);
      expect(serializeCard({ ...base, deleted: 1767139200000 }).deleted).to.equal(1767139200000);
    });
    it('omits access_code by default (GET)', () => {
      expect(serializeCard(base)).to.not.have.property('access_code');
    });
    it('includes access_code when asked (create/delete)', () => {
      expect(serializeCard(base, { includeAccessCode: true })).to.have.property(
        'access_code',
        null
      );
      const priv = serializeCard({ ...base, access_code: 'A1B2C3' }, { includeAccessCode: true });
      expect(priv.access_code).to.equal('A1B2C3');
    });
    it('returns null for empty input', () => {
      expect(serializeCard(null)).to.equal(null);
    });
  });

  describe('throwCardError', () => {
    function capture(code) {
      let thrown;
      try {
        throwCardError(code);
      } catch (e) {
        thrown = e;
      }
      return thrown;
    }

    it('throws an application error with the assessment code under context', () => {
      const err = capture('NF01');
      expect(err.isApplicationError).to.equal(true);
      expect(err.context).to.deep.equal({ code: 'NF01' });
      expect(err.message).to.equal('Creator card not found');
    });
    it('maps codes to the correct template ERROR_CODE (drives HTTP status)', () => {
      expect(capture('NF01').errorCode).to.equal(ERROR_CODE.NOTFOUND); // 404
      expect(capture('AC03').errorCode).to.equal(ERROR_CODE.INVLDREQ); // 403
      expect(capture('SL02').errorCode).to.equal(ERROR_CODE.INVLDDATA); // 400 default
    });
  });
});
