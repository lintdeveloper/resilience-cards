// POST /creator-cards — create a creator card.
// Field shape below is enforced by the VSL validator. Rules VSL cannot express
// (slug/access_code charset, access_code conditional, slug uniqueness) are
// business rules in the service — see ADR 0003 / ADR 0002 for error codes.

CreateCreatorCardRequest {
  path /creator-cards
  method POST

  body {
    title string<trim|minLength:3|maxLength:100>
    description? string<trim|maxLength:500>
    slug? string<trim|minLength:5|maxLength:50> // auto-generated from title when omitted
    creator_reference string<length:20>

    links[] {
      title string<trim|minLength:1|maxLength:100>
      url string<trim|maxLength:200|startsWith:http>
    }

    service_rates? {
      currency string(NGN|USD|GBP|GHS)
      rates[] {
        name string<trim|minLength:3|maxLength:100>
        description? string<trim|maxLength:250>
        amount number<min:1> // positive integer, minor units
      }
    }

    status string(draft|published)
    access_type? string(public|private) // defaults to public
    access_code? string<length:6> // required iff private, forbidden iff public (business rule)
  }

  response.ok {
    http.code 200
    status success
    message "Creator card created"
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

  // Business-rule errors (field-shape errors return 400 with no custom code):
  // 400 SL02 — client-supplied slug already taken
  // 400 AC01 — access_code required on a private card
  // 400 AC05 — access_code provided on a public card
  response.error {
    http.code 400
    status error
    message "Validation or business rule failed"
    data {
      code string // e.g. SL02 | AC01 | AC05 (absent for plain field-validation errors)
    }
  }
}
