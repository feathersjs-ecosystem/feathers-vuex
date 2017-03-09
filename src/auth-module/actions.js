export default function makeAuthActions (feathers, options) {
  const { auth } = options
  return {
    authenticate (store, data) {
      const { commit, state, dispatch } = store

      commit('setPending')
      if (state.isError) {
        commit('clearError')
      }
      return feathers.authenticate(data)
        .then(response => {
          commit('unsetPending')
          commit('setAccessToken', response.accessToken)

          // Decode the token and set the payload, but return the response
          return feathers.passport.verifyJWT(response.accessToken)
            .then(payload => {
              commit('setPayload', payload)

              // Populate the user if the userService was provided
              if (auth.userService && payload.userId) {
                return dispatch('populateUser', payload.userId)
                  .then(() => response)
              }
              return response
            })
        })
        .catch(error => {
          commit('unsetPending')
          commit('setError', error)
          return error
        })
    },
    populateUser ({ commit }, userId) {
      return feathers.service(auth.userService)
        .get(userId)
        .then(user => {
          commit('setUser', user)
          return user
        })
        .catch(error => {
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
