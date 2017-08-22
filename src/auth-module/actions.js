export default function makeAuthActions (feathersClient) {
  return {
    authenticate (store, data) {
      const { commit, state, dispatch } = store

      commit('setAuthenticatePending')
      if (state.errorOnAuthenticate) {
        commit('clearAuthenticateError')
      }
      return feathersClient.authenticate(data)
        .then(response => {
          commit('setAccessToken', response.accessToken)

          // Decode the token and set the payload, but return the response
          return feathersClient.passport.verifyJWT(response.accessToken)
            .then(payload => {
              commit('setPayload', payload)

              // Populate the user if the userService was provided
              if (state.userService && payload.hasOwnProperty('userId')) {
                return dispatch('populateUser', payload.userId)
                  .then(() => {
                    commit('unsetAuthenticatePending')
                    return response
                  })
              } else {
                commit('unsetAuthenticatePending')
              }
              return response
            })
        })
        .catch(error => {
          commit('setAuthenticateError', error)
          commit('unsetAuthenticatePending')
          return Promise.reject(error)
        })
    },

    populateUser ({ commit, state }, userId) {
      return feathersClient.service(state.userService)
        .get(userId)
        .then(user => {
          commit('setUser', user)
          return user
        })
    },

    logout ({commit}) {
      commit('setLogoutPending')
      return feathersClient.logout()
        .then(response => {
          commit('logout')
          commit('unsetLogoutPending')
          return response
        })
        .catch(error => {
          return Promise.reject(error)
        })
    }
  }
}
