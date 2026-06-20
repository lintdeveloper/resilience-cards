const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator_cards';

/**
 * Creator Card schema. `_id` is a ULID (serialized as `id` in responses).
 * Soft-delete is handled by the paranoid option: the framework adds a `deleted`
 * field (default 0 → serialized to null), excludes deleted docs from findOne,
 * and frees the unique `slug` on delete. `created`/`updated` are set by the
 * repository create(). `links`/`service_rates` are stored as-is (Mixed) — their
 * shape is enforced on input by the VSL validator in the service layer.
 *
 * @typedef {Object} CreatorCardModel
 * @property {String} _id
 * @property {String} title
 * @property {String} description
 * @property {String} slug
 * @property {String} creator_reference
 * @property {Object[]} links
 * @property {Object} service_rates
 * @property {String} status
 * @property {String} access_type
 * @property {String} access_code
 * @property {Number} created
 * @property {Number} updated
 * @property {Number} deleted
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID, required: true },
  title: { type: SchemaTypes.String, required: true },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, required: true, unique: true },
  creator_reference: { type: SchemaTypes.String, required: true, index: true },
  links: { type: SchemaTypes.Mixed, required: true },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String, required: true, index: true },
  access_type: { type: SchemaTypes.String, required: true, default: 'public' },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number, required: true },
  updated: { type: SchemaTypes.Number, required: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

/** @type {CreatorCardModel} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
