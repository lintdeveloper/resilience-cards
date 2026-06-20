import ../commons.go

// Creator Card — database schema (model definition, not service-input validation).
// Mongo `_id` is a ULID and is serialized as `id` in all API responses (never `_id`).
// Input validation + business rules live in the services (see ADR 0003).

CreatorCard {
  _id string<isUnique|indexed> // ULID; exposed as `id` in responses
  title string // 3–100 chars
  description string // up to 500 chars
  slug string<isUnique|indexed> // 5–50 chars, charset [A-Za-z0-9_-]; unique
  creator_reference string<indexed> // exactly 20 chars; owner secret used for delete

  // External links shown on the card
  links[] {
    title string // 1–100 chars
    url string // up to 200 chars; must start with http:// or https://
  }

  // Optional pricing block; when present, currency is set and rates is non-empty
  service_rates? {
    currency string // enum: NGN | USD | GBP | GHS
    rates[] {
      name string // 3–100 chars
      description? string // up to 250 chars
      amount number // positive integer, minor units (e.g. kobo/cents)
    }
  }

  status string<indexed> // enum: draft | published
  access_type string // enum: public | private (defaults to public)
  access_code? string // exactly 6 alphanumeric chars; required iff private, absent iff public; never returned

  ...common // created, updated, deleted?
}
