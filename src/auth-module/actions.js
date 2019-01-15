export default function makeAuthActions (feathersClient, globalModels) {
  return {
    authenticate (store, data) {
      const { commit, state, dispatch } = store

      commit('setAuthenticatePending')
      if (state.errorOnAuthenticate) {
        commit('clearAuthenticateError')
      }
      return feathersClient.authenticate(data)
        .then(response => {
          if (response.accessToken) {
            commit('setAccessToken', response.accessToken)

            // Decode the token and set the payload, but return the response
            return feathersClient.passport.verifyJWT(response.accessToken)
              .then(payload => {
                commit('setPayload', payload)

                // Populate the user if the userService was provided
                if (state.userService && payload.hasOwnProperty(state.entityIdField)) {
                  return dispatch('populateUser', payload[state.entityIdField])
                    .then(() => {
                      commit('unsetAuthenticatePending')
                      return response
                    })
                } else {
                  commit('unsetAuthenticatePending')
                }
                return response
              })
          // If there was not an accessToken in the response, allow the response to pass through to handle two-factor-auth
          } else {
            return response
          }
        })
        .catch(error => {
          commit('setAuthenticateError', error)
          commit('unsetAuthenticatePending')
          return Promise.reject(error)
        })
    },

    populateUser ({ commit, state, rootState, dispatch }, userId) {
      return dispatch(`${state.userService}/get`, userId, { root: true })
        .then(user => {
          commit('setUser', user)
          return user
        })
    },

    logout ({ commit }) {
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
