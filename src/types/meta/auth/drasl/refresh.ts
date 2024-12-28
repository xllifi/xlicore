import type * as shared from './shared.js'
import type * as authenticate from './authenticate.js'

export type Request = {
  /** Latest valid accessToken */
  accessToken: string
  /** Client ID. Must be identical to the one used/returned when obtaining accessToken */
  clientToken: string
  /** Selected game profile. UUID and username */
  selectedProfile: shared.Profile
  /** Optional, defaults to `false`. Use `true` to get user object */
  requestUser?: boolean
}

export type Response = authenticate.Response
