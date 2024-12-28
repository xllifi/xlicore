export type Request = {
  /** Latest valid accessToken */
  accessToken: string
  /** Client ID. Must be identical to the one used/returned when obtaining accessToken */
  clientToken: string
}

// Responds either 204 (valid) or 403 (invalid)
