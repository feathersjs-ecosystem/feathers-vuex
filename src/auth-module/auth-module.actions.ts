/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { globalModels as models } from '../service-module/global-models'
import { getNameFromPath } from '../utils'

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
        commit('setPayload', response)

        // Handle when user is returned in the authenticate response
        let user = response[state.responseEntityField]

        if (user) {
          if (state.serverAlias && state.userService) {
            const Model = Object.keys(models[state.serverAlias])
              .map(modelName => models[state.serverAlias][modelName])
              .find(model => getNameFromPath(model.servicePath) === getNameFromPath(state.userService))
            if (Model) {
              user = new Model(user)
            }
          }
          commit('setUser', user)
          commit('unsetAuthenticatePending')
        } else if (
          state.userService &&
          response.hasOwnProperty(state.entityIdField)
        ) {
          return dispatch(
            'populateUser',
            response[state.entityIdField]
          ).then(() => {
            commit('unsetAuthenticatePending')
            return response
          })
        }
        return response

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
