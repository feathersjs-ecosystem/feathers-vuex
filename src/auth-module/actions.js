export default function makeAuthActions (feathers, options) {
  return {
    authenticate ({commit, state}, data) {
      commit('setPending')
      if (state.isError) {
        commit('clearError')
      }
      return feathers.authenticate(data)
        .then(response => {
          commit('unsetPending')
          commit('setAccessToken', response.accessToken)
          return response
        })
        .catch(error => {
          commit('unsetPending')
          commit('setError', error)
          return error
        })
    },
    logout ({commit}) {
      commit('setPending')
      return feathers.logout()
        .then(response => {
          commit('unsetPending')
          commit('logout')
          return response
        })
    }
  }
}
