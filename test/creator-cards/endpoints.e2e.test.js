// End-to-end tests for the three creator-cards endpoints. Drives the real
// router + VSL validation + services + serialization via the template's
// mock-server. The repository is backed by stub models (USE_MOCK_MODEL=1); each
// test shapes what the model methods return via configureStubs. Run: `npm test`.
const { expect } = require('chai');
const createMockServer = require('@app-core/mock-server');
const { MockModelStubs } = require('@app/mock-models');

const server = createMockServer(['endpoints/creator-cards']);
const cardStubs = MockModelStubs.CreatorCard;

const CREATOR_REF = 'crt_8f2k1m9x4p7w3q5z'; // exactly 20 chars

const validBody = () => ({
  title: 'George Cooks',
  description: 'A weekly cooking podcast',
  slug: 'george-cooks',
  creator_reference: CREATOR_REF,
  links: [{ title: 'YouTube Channel', url: 'https://youtube.com/@georgecooks' }],
  service_rates: {
    currency: 'NGN',
    rates: [{ name: 'IG Story Post', description: 'One IG story mention', amount: 5000000 }],
  },
  status: 'published',
  access_type: 'public',
});

describe('creator-cards endpoints (e2e)', () => {
  let reverts = [];

  before(() => {
    if (!cardStubs) {
      throw new Error('CreatorCard mock stubs missing — run via `npm test` (USE_MOCK_MODEL=1).');
    }
  });

  function stub(config) {
    const handle = cardStubs.configureStubs(config);
    reverts.push(handle.revert);
    return handle;
  }

  afterEach(() => {
    reverts.forEach((revert) => revert());
    reverts = [];
  });

  // ---- Valid cases -------------------------------------------------------

  it('1. creates a card with all fields (200, id not _id, defaults public)', async () => {
    stub({ method: 'findOne', mockNull: true }); // slug free
    const res = await server.post('/creator-cards', { body: validBody() });

    expect(res.statusCode).to.equal(200);
    expect(res.data.status).to.equal('success');
    expect(res.data.message).to.equal('Creator Card Created Successfully.');
    expect(res.data.data.id).to.be.a('string').with.length.above(0);
    expect(res.data.data).to.not.have.property('_id');
    expect(res.data.data.access_type).to.equal('public');
    expect(res.data.data.access_code).to.equal(null);
    expect(res.data.data.slug).to.equal('george-cooks');
  });

  it('2. auto-generates slug from title when omitted (200)', async () => {
    stub({ method: 'findOne', mockNull: true });
    const body = validBody();
    delete body.slug;
    const res = await server.post('/creator-cards', { body });

    expect(res.statusCode).to.equal(200);
    expect(res.data.data.slug).to.equal('george-cooks');
  });

  it('3. creates a private card and returns the access_code (200)', async () => {
    stub({ method: 'findOne', mockNull: true });
    const body = { ...validBody(), access_type: 'private', access_code: 'A1B2C3' };
    const res = await server.post('/creator-cards', { body });

    expect(res.statusCode).to.equal(200);
    expect(res.data.data.access_code).to.equal('A1B2C3');
  });

  it('4. retrieves a public published card (200, no access_code, id present)', async () => {
    stub({ method: 'findOne', docConfig: { status: 'published', access_type: 'public' } });
    const res = await server.get('/creator-cards/george-cooks');

    expect(res.statusCode).to.equal(200);
    expect(res.data.message).to.equal('Creator Card Retrieved Successfully.');
    expect(res.data.data).to.not.have.property('access_code');
    expect(res.data.data.id).to.be.a('string').with.length.above(0);
  });

  it('5. retrieves a private card with the correct access_code (200, no access_code)', async () => {
    stub({
      method: 'findOne',
      docConfig: { status: 'published', access_type: 'private', access_code: 'A1B2C3' },
    });
    const res = await server.get('/creator-cards/george-cooks?access_code=A1B2C3');

    expect(res.statusCode).to.equal(200);
    expect(res.data.data).to.not.have.property('access_code');
  });

  it('6. deletes a card (200, returns card with deleted timestamp)', async () => {
    stub({ method: 'findOne', docConfig: { status: 'published' } }); // exists
    const res = await server.delete('/creator-cards/george-cooks', {
      body: { creator_reference: CREATOR_REF },
    });

    expect(res.statusCode).to.equal(200);
    expect(res.data.message).to.equal('Creator Card Deleted Successfully.');
    expect(res.data.data.deleted).to.be.a('number');
  });

  // ---- Invalid cases -----------------------------------------------------

  it('7. rejects a duplicate client-provided slug (400 SL02)', async () => {
    // default findOne returns a doc => slug already taken
    const res = await server.post('/creator-cards', { body: validBody() });

    expect(res.statusCode).to.equal(400);
    expect(res.data.status).to.equal('error');
    expect(res.data.code).to.equal('SL02');
  });

  it('8. rejects a private card with no access_code (400 AC01)', async () => {
    const body = { ...validBody(), access_type: 'private' };
    delete body.access_code;
    const res = await server.post('/creator-cards', { body });

    expect(res.statusCode).to.equal(400);
    expect(res.data.code).to.equal('AC01');
  });

  it('9. rejects access_code on a public card (400 AC05)', async () => {
    const body = { ...validBody(), access_type: 'public', access_code: 'A1B2C3' };
    const res = await server.post('/creator-cards', { body });

    expect(res.statusCode).to.equal(400);
    expect(res.data.code).to.equal('AC05');
  });

  it('10. rejects an invalid enum via the framework validator (400, no custom code)', async () => {
    const body = { ...validBody(), status: 'archived' };
    const res = await server.post('/creator-cards', { body });

    expect(res.statusCode).to.equal(400);
    expect(res.data.status).to.equal('error');
    // framework validation errors carry no custom code (neither top-level nor nested)
    expect(res.data.code).to.equal(undefined);
  });

  it('11. returns 404 NF01 for a non-existent card', async () => {
    stub({ method: 'findOne', mockNull: true });
    const res = await server.get('/creator-cards/does-not-exist');

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF01');
  });

  it('12. returns 404 NF02 for a draft card', async () => {
    stub({ method: 'findOne', docConfig: { status: 'draft' } });
    const res = await server.get('/creator-cards/george-cooks');

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF02');
  });

  it('13. returns 403 AC03 for a private card with no access_code', async () => {
    stub({
      method: 'findOne',
      docConfig: { status: 'published', access_type: 'private', access_code: 'A1B2C3' },
    });
    const res = await server.get('/creator-cards/george-cooks');

    expect(res.statusCode).to.equal(403);
    expect(res.data.code).to.equal('AC03');
  });

  it('14. returns 403 AC04 for a private card with a wrong access_code', async () => {
    stub({
      method: 'findOne',
      docConfig: { status: 'published', access_type: 'private', access_code: 'A1B2C3' },
    });
    const res = await server.get('/creator-cards/george-cooks?access_code=WRONG1');

    expect(res.statusCode).to.equal(403);
    expect(res.data.code).to.equal('AC04');
  });

  it('15. returns 404 NF01 when deleting a non-existent card', async () => {
    stub({ method: 'findOne', mockNull: true });
    const res = await server.delete('/creator-cards/does-not-exist', {
      body: { creator_reference: CREATOR_REF },
    });

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF01');
  });

  it('16. returns 404 NF01 when retrieving a previously deleted card', async () => {
    // soft-deleted docs are excluded by the paranoid findOne => looks absent
    stub({ method: 'findOne', mockNull: true });
    const res = await server.get('/creator-cards/george-cooks');

    expect(res.statusCode).to.equal(404);
    expect(res.data.code).to.equal('NF01');
  });
});
