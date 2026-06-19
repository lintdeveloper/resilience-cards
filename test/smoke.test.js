const { expect } = require('chai');
const validator = require('@app-core/validator');
const { ulid } = require('@app-core/randomness');

// Smoke test: proves the template's core aliases resolve and the VSL validator
// + id generation work end-to-end. Replace/expand with real creator-card tests.
describe('smoke: core wiring', () => {
  it('generates a 26-char ULID for the `id` field', () => {
    const id = ulid();
    expect(id).to.be.a('string');
    expect(id).to.have.lengthOf(26);
  });

  it('parses a VSL spec and validates conforming data', () => {
    const spec = validator.parse(`root {
      title string<minLength:3|maxLength:100>
      status string(draft|published)
    }`);

    const result = validator.validate({ title: 'Hello', status: 'draft' }, spec);
    expect(result).to.include({ title: 'Hello', status: 'draft' });
  });

  it('throws an application error on invalid data', () => {
    const spec = validator.parse(`root {
      title string<minLength:3>
    }`);

    let thrown;
    try {
      validator.validate({ title: 'ab' }, spec);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).to.be.an('error');
    expect(thrown.isApplicationError).to.equal(true);
  });
});
