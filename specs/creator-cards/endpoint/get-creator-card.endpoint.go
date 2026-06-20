// GET /creator-cards/:slug — public retrieval.
// Access checks run in STRICT order (see ADR 0002 for code→status):
//   1. not found            -> 404 NF01
//   2. status === draft     -> 404 NF02  (exists but not public)
//   3. private, no code      -> 403 AC03
//   4. private, wrong code   -> 403 AC04
//   5. ok                    -> 200
// Private access via query param: GET /creator-cards/:slug?access_code=A1B2C3

GetCreatorCardRequest {
  path /creator-cards/:slug
  method GET

  params {
    slug string<trim|minLength:5|maxLength:50>
  }

  query {
    access_code? string<length:6> // required only for private cards
  }

  response.ok {
    http.code 200
    status success
    message "Creator card retrieved"
    data {
      id string<length:26>
      title string
      description string
      slug string
      creator_reference string
      links[] {
        title string
        url string
      }
      service_rates? {
        currency string
        rates[] {
          name string
          description? string
          amount number
        }
      }
      status string
      access_type string
      // access_code is NEVER returned
      created number
      updated number
      deleted? number
    }
  }

  // 404 NF01 — card does not exist (or is soft-deleted)
  // 404 NF02 — card exists but status is draft
  // 403 AC03 — private card, no access_code supplied
  // 403 AC04 — private card, wrong access_code
  response.error {
    http.code 404
    status error
    message "Not found or access denied"
    data {
      code string // NF01 | NF02 | AC03 | AC04
    }
  }
}
