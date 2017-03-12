export default function makeAuthActions (feathers, options) {
  const { auth } = options
  return {
    authenticate (store, data) {
      const { commit, state, dispatch } = store

      commit('setAuthenticationPending')
      if (state.errorOnAuthentication) {
        commit('clearAuthenticationError')
      }
      return feathers.authenticate(data)
        .then(response => {
          commit('setAccessToken', response.accessToken)

          // Decode the token and set the payload, but return the response
          return feathers.passport.verifyJWT(response.accessToken)
            .then(payload => {
              commit('setPayload', payload)

              // Populate the user if the userService was provided
              if (auth.userService && payload.userId) {
                return dispatch('populateUser', payload.userId)
                  .then(() => {
                    commit('unsetAuthenticationPending')
                    return response
                  })
              } else {
                commit('unsetAuthenticationPending')
              }
              return response
            })
        })
        .catch(error => {
          commit('setAuthenticationError', error)
          commit('unsetAuthenticationPending')
          return Promise.reject(error)
        })
    },

    populateUser ({ commit }, userId) {
      return feathers.service(auth.userService)
        .get(userId)
        .then(user => {
          commit('setUser', user)
          return user
        })
    },

    logout ({commit}) {
      commit('setLogoutPending')
      return feathers.logout()
        .then(response => {
          commit('logout')
          commit('unsetLogoutPending')
          return response
        })
    }
  }
}
