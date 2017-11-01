export default function makeAuthMutations (feathers) {
  return {
    setAccessToken (state, payload) {
      state.accessToken = payload
    },
    setPayload (state, payload) {
      state.payload = payload
    },
    setUser (state, payload) {
      state.user = payload
    },

    setAuthenticatePending (state) {
      state.isAuthenticatePending = true
    },
    unsetAuthenticatePending (state) {
      state.isAuthenticatePending = false
    },
    setLogoutPending (state) {
      state.isLogoutPending = true
    },
    unsetLogoutPending (state) {
      state.isLogoutPending = false
    },

    setAuthenticateError (state, error) {
      state.errorOnAuthenticate = Object.assign({}, error)
    },
    clearAuthenticateError (state) {
      state.errorOnAuthenticate = null
    },
    setLogoutError (state, error) {
      state.errorOnLogout = Object.assign({}, error)
    },
    clearLogoutError (state) {
      state.errorOnLogout = null
    },

    logout (state) {
      state.payload = null
      state.accessToken = null
      if (state.user) {
        state.user = null
      }
    }
  }
}
