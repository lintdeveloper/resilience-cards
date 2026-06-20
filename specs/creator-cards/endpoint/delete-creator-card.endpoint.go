// DELETE /creator-cards/:slug — soft-delete a card.
// Requires creator_reference (exactly 20 chars) in the body.
// On success the card is soft-deleted (deleted = timestamp) and becomes
// unretrievable via GET. See ADR 0002 for code→status.

DeleteCreatorCardRequest {
  path /creator-cards/:slug
  method DELETE

  params {
    slug string<trim|minLength:5|maxLength:50>
  }

  body {
    creator_reference string<length:20>
  }

  response.ok {
    http.code 200
    status success
    message "Creator card deleted"
    data {
      id string<length:26>
      title string
      slug string
      creator_reference string
      status string
      access_type string
      created number
      updated number
      deleted number // Unix milliseconds — set at deletion
    }
  }

  // 404 NF01 — card does not exist (or already deleted)
  response.error {
    http.code 404
    status error
    message "Card not found"
    data {
      code string // NF01
    }
  }
}
