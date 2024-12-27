export type Request = {
  /** Account username */
  username: string
  /** Account password */
  password: string
}

// Responds either 204 (successfull) or 401 (incorrect credentials)
