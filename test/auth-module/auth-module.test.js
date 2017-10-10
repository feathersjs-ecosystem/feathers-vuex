import assert from 'chai/chai'
import setupVuexAuth from '~/src/auth-module/auth-module'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex from 'vuex'

const auth = setupVuexAuth(feathersClient)

describe('Auth Module', () => {
  describe('Configuration', () => {
    it('has default auth namespace', () => {
      const store = new Vuex.Store({
        plugins: [
          auth()
        ]
      })
      const authState = store.state.auth
      const expectedAuthState = {
        accessToken: undefined,
        errorOnAuthenticate: undefined,
        errorOnLogout: undefined,
        isAuthenticatePending: false,
        isLogoutPending: false,
        payload: undefined
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
})
