export default function setupAuthState ({ userService }) {
  const state = {
    accessToken: null, // The JWT
    payload: null, // The JWT payload
    entityIdField: 'userId',

    isAuthenticatePending: false,
    isLogoutPending: false,

    errorOnAuthenticate: null,
    errorOnLogout: null,
    user: null
  }
  // If a userService string was passed, add a user attribute
  if (userService) {
    Object.assign(state, { userService })
  }
  return state
}
