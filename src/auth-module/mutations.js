export default function makeAuthMutations (feathers, options) {
  return {
    setAccessToken (state, payload) {
      state.accessToken = payload
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
      state.error = error
    },
    logout (state) {
      
    }
  }
}
