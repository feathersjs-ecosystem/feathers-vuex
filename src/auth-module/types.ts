export interface AuthState {
  accessToken: string
  payload: {}
  entityIdField: string

  isAuthenticatePending: boolean
  isLogoutPending: boolean

  errorOnAuthenticate: Error
  errorOnLogout: Error
  user: {}
}
