import setupMutations from './mutations'
import setupActions from './actions'

export default function setupAuthModule (store, options) {
  if (!options.auth) {
    return () => {}
  }

  return feathers => {
    if (!feathers.passport) {
      throw new Error('You must register the feathers-authentication-client plugin before Feathers-Vuex')
    }

    const { auth } = options
    const { namespace } = auth
    const state = {
      accessToken: undefined, // The JWT
      payload: undefined, // The JWT payload

      isAuthenticatePending: false,
      isLogoutPending: false,

      errorOnAuthenticate: undefined,
      errorOnLogout: undefined
    }
    // If a userService string was passed, add a user attribute
    if (auth.userService) {
      state.user = null
    }
    const combinedState = Object.assign(state, auth.state)
    const mutations = setupMutations(feathers, options)
    const actions = setupActions(feathers, options)

    store.registerModule(namespace, {
      namespaced: true,
      state: combinedState,
      mutations,
      actions
    })
  }
}
