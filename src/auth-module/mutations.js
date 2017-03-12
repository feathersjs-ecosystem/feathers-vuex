export default function makeAuthMutations (feathers, options) {
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

    setAuthenticationPending (state) {
      state.isAuthenticationPending = true
    },
    unsetAuthenticationPending (state) {
      state.isAuthenticationPending = false
    },
    setLogoutPending (state) {
      state.isLogoutPending = true
    },
    unsetLogoutPending (state) {
      state.isLogoutPending = false
    },

    setAuthenticationError (state, error) {
      state.errorOnAuthentication = Object.assign({}, error)
    },
    clearAuthenticationError (state) {
      state.errorOnAuthentication = undefined
    },
    setLogoutError (state, error) {
      state.errorOnLogout = Object.assign({}, error)
    },
    clearLogoutError (state) {
      state.errorOnLogout = undefined
    },

    logout (state) {
      state.payload = undefined
      state.accessToken = undefined
      if (state.user) {
        state.user = undefined
      }
    }
  }
}
