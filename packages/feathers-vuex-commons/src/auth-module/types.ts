export interface AuthState {
  accessToken: string
  payload: {}
  entityIdField: string
  responseEntityField: string

  isAuthenticatePending: boolean
  isLogoutPending: boolean

  errorOnAuthenticate: Error
  errorOnLogout: Error
  user: {}
  userService: string
  serverAlias: string
}
