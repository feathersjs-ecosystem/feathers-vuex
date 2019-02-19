import assert from 'chai/chai'
import setupVuexAuth from '~/src/auth-module/auth-module'
import setupVuexService from '~/src/service-module/service-module'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex from 'vuex'

const options = {}
const globalModels = {}

const auth = setupVuexAuth(feathersClient, options, globalModels)
const service = setupVuexService(feathersClient, options, globalModels)

describe('Auth Module', () => {
  describe('Configuration', () => {
    it('has default auth namespace', () => {
      const store = new Vuex.Store({
        plugins: [
          service('users'),
          auth()
        ]
      })
      const authState = store.state.auth
      const expectedAuthState = {
        accessToken: null,
        errorOnAuthenticate: null,
        errorOnLogout: null,
        isAuthenticatePending: false,
        isLogoutPending: false,
        payload: null,
        entityIdField: 'userId',
        user: null
      }

      assert.deepEqual(authState, expectedAuthState, 'has the default state')
    })

    it('can customize the namespace', function () {
      const store = new Vuex.Store({
        plugins: [
          auth({ namespace: 'authentication' })
        ]
      })

      assert(store.state.authentication, 'the custom namespace was used')
    })
  })

  describe('Customizing Auth Store', function () {
    it('allows adding custom state', function () {
      const customState = {
        test: true,
        test2: {
          test: true
        }
      }
      const store = new Vuex.Store({
        plugins: [
          auth({ state: customState })
        ]
      })

      assert(store.state.auth.test === true, 'added custom state')
      assert(store.state.auth.test2.test === true, 'added custom state')
    })

    it('allows custom mutations', function () {
      const state = { test: true }
      const customMutations = {
        setTestToFalse (state) {
          state.test = false
        }
      }
      const store = new Vuex.Store({
        plugins: [
          auth({ state, mutations: customMutations })
        ]
      })

      store.commit('auth/setTestToFalse')
      assert(store.state.auth.test === false, 'the custom state was modified by the custom mutation')
    })

    it('allows custom getters', function () {
      const customGetters = {
        oneTwoThree (state) {
          return 123
        }
      }
      const store = new Vuex.Store({
        plugins: [
          auth({ getters: customGetters })
        ]
      })

      assert(store.getters['auth/oneTwoThree'] === 123, 'the custom getter was available')
    })

    it('allows adding custom actions', function () {
      const config = {
        state: {
          isTrue: false
        },
        mutations: {
          setToTrue (state) {
            state.isTrue = true
          }
        },
        actions: {
          trigger (context) {
            context.commit('setToTrue')
          }
        }
      }
      const store = new Vuex.Store({
        plugins: [
          auth(config)
        ]
      })

      store.dispatch('auth/trigger')
      assert(store.state.auth.isTrue === true, 'the custom action was run')
    })
  })
})
