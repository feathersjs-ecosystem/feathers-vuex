import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'
import { mapActions } from 'vuex'
import memory from 'feathers-memory'

const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImV4cCI6OTk5OTk5OTk5OTk5OX0.RSVn5U51HLa8xAo2ilpOHB076DmD7au6tYQw5cEgPKY'

describe('Auth Module Actions', () => {
  it('Authenticate', (done) => {
    const store = makeStore()
    const feathersClient = makeFeathersRestClient()
      .configure(feathersVuex(store))
    feathersClient.service('authentication', {
      create (data) {
        return Promise.resolve({ accessToken })
      }
    })

    const authState = store.state.auth
    const actions = mapActions('auth', ['authenticate'])

    assert(authState.accessToken === undefined)
    assert(authState.errorOnAuthenticate === undefined)
    assert(authState.errorOnLogout === undefined)
    assert(authState.isAuthenticatePending === false)
    assert(authState.isLogoutPending === false)
    assert(authState.payload === undefined)

    const request = {strategy: 'local', email: 'test', password: 'test'}
    actions.authenticate.call({$store: store}, request)
    .then(response => {
      assert(authState.accessToken === response.accessToken)
      assert(authState.errorOnAuthenticate === undefined)
      assert(authState.errorOnLogout === undefined)
      assert(authState.isAuthenticatePending === false)
      assert(authState.isLogoutPending === false)
      let expectedPayload = {
        sub: '1234567890',
        name: 'John Doe',
        admin: true,
        exp: 9999999999999
      }
      assert.deepEqual(authState.payload, expectedPayload)
      done()
    })

    // Make sure proper state changes occurred before response
    assert(authState.accessToken === undefined)
    assert(authState.errorOnAuthenticate === undefined)
    assert(authState.errorOnLogout === undefined)
    assert(authState.isAuthenticatePending === true)
    assert(authState.isLogoutPending === false)
    assert(authState.payload === undefined)
  })
})
