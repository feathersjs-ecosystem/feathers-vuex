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
    setPending (state) {
      state.isPending = true
    },
    unsetPending (state) {
      state.isPending = false
    },
    clearError (state) {
      state.isError = false
      state.error = undefined
    },
    setError (state, error) {
      state.isError = true
      state.error = Object.assign({}, error)
    },
    logout (state) {

    }
  }
}
