/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
export default function makeAuthActions(feathersClient) {
  return {
    authenticate(store, data) {
      const { commit, state, dispatch } = store

      commit('setAuthenticatePending')
      if (state.errorOnAuthenticate) {
        commit('clearAuthenticateError')
      }
      return feathersClient
        .authenticate(data)
        .then(response => {
          return dispatch('responseHandler', response)
        })
        .catch(error => {
          commit('setAuthenticateError', error)
          commit('unsetAuthenticatePending')
          return Promise.reject(error)
        })
    },

    responseHandler({ commit, state, dispatch }, response) {
      if (response.accessToken) {
        commit('setAccessToken', response.accessToken)

        // Decode the token and set the payload, but return the response
        return feathersClient.passport
          .verifyJWT(response.accessToken)
          .then(payload => {
            commit('setPayload', payload)

            // If a user was returned in the authenticate response, use that user.
            if (response[state.responseEntityField]) {
              commit('setUser', response[state.responseEntityField])
              // Populate the user if the userService was provided
            } else if (
              state.userService &&
              payload.hasOwnProperty(state.entityIdField)
            ) {
              return dispatch(
                'populateUser',
                payload[state.entityIdField]
              ).then(() => {
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
    },

    populateUser({ commit, state, dispatch }, userId) {
      return dispatch(`${state.userService}/get`, userId, { root: true }).then(
        user => {
          commit('setUser', user)
          return user
        }
      )
    },

    logout({ commit }) {
      commit('setLogoutPending')
      return feathersClient
        .logout()
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
