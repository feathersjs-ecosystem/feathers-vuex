/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
export default function setupAuthState({ userService }) {
  const state = {
    accessToken: null, // The JWT
    payload: null, // The JWT payload
    entityIdField: 'userId',
    responseEntityField: 'user',

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
