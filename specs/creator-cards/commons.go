// Common fields shared across creator-cards models.
// Spread into a model definition with ...common
// NOTE: .go extension is for syntax highlighting only — these are VSL specs.

common {
  created number // Unix milliseconds — set on create
  updated number // Unix milliseconds — set on create and every update
  deleted? number // Unix milliseconds — set on soft delete; null/absent while live
}
