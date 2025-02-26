import type * as shared from './shared.js'

export type Request = {
  /** Game */
  agent: {
    /** defaults to Minecraft */
    name: 'Minecraft' | 'Scrolls'
    /** This number might be increased by the vanilla client in the future */
    version: number
  }
  /** Playername */
  username: string
  /** Account password */
  password: string
  /** Client ID. Optional */
  clientToken?: string
  /** Optional, defaults to `false`. Use `true` to get user object */
  requestUser?: boolean
}

export type Response = {
  /** Access token */
  accessToken: string
  /** Client ID */
  clientToken: string
  /** User object */
  user?: {
    /** User's UUID */
    id: string
    /** User's settings (e.g. language) */
    properties: [
      {
        name: string
        value: string
      }
    ]
  }
  /** Available game profiles. UUID and username */
  availableProfiles: shared.Profile[]
  /** Selected game profile. UUID and username */
  selectedProfile: shared.Profile
}

export function isValidResponse (data: Response | never): data is Response {
  return (
    typeof data.accessToken === 'string' &&
    typeof data.clientToken === 'string' &&
    (!data.user || ('id' in data.user && Array.isArray(data.user.properties))) &&
    Array.isArray(data.availableProfiles) &&
    'uuid' in data.selectedProfile &&
    'name' in data.selectedProfile
  );
};
