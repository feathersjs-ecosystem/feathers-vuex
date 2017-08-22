export default function setupAuthState ({ userService }) {
  const state = {
    accessToken: undefined, // The JWT
    payload: undefined, // The JWT payload

    isAuthenticatePending: false,
    isLogoutPending: false,

    errorOnAuthenticate: undefined,
    errorOnLogout: undefined
  }
  // If a userService string was passed, add a user attribute
  if (userService) {
    Object.assign(state, { userService, user: undefined })
  }
  return state
}
