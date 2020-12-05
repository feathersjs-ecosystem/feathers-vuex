/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { serializeError } from 'serialize-error'

export default function makeAuthMutations() {
  return {
    setAccessToken(state, payload) {
      state.accessToken = payload
    },
    setPayload(state, payload) {
      state.payload = payload
    },
    setUser(state, payload) {
      state.user = payload
    },

    setAuthenticatePending(state) {
      state.isAuthenticatePending = true
    },
    unsetAuthenticatePending(state) {
      state.isAuthenticatePending = false
    },
    setLogoutPending(state) {
      state.isLogoutPending = true
    },
    unsetLogoutPending(state) {
      state.isLogoutPending = false
    },

    setAuthenticateError(state, error) {
      state.errorOnAuthenticate = Object.assign({}, serializeError(error))
    },
    clearAuthenticateError(state) {
      state.errorOnAuthenticate = null
    },
    setLogoutError(state, error) {
      state.errorOnLogout = Object.assign({}, serializeError(error))
    },
    clearLogoutError(state) {
      state.errorOnLogout = null
    },

    logout(state) {
      state.payload = null
      state.accessToken = null
      if (state.user) {
        state.user = null
      }
    },
  }
}
