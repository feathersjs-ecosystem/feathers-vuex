import assert from 'chai/chai'
import setupVuexAuth from '~/src/auth-module/auth-module'
import setupVuexService from '~/src/service-module/service-module'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex, { mapActions } from 'vuex'
import memory from 'feathers-memory'

const auth = setupVuexAuth(feathersClient)
const service = setupVuexService(feathersClient)
const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjAsImV4cCI6OTk5OTk5OTk5OTk5OX0.zmvEm8w142xGI7CbUsnvVGZk_hrVE1KEjzDt80LSW50'

describe('Auth Module - Actions', () => {
  it('Authenticate', (done) => {
    const store = new Vuex.Store({
      plugins: [auth()]
    })
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
        userId: 0,
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

  it('Logout', (done) => {
    const store = new Vuex.Store({
      plugins: [auth()]
    })
    feathersClient.service('authentication', {
      create (data) {
        return Promise.resolve({ accessToken })
      }
    })

    const authState = store.state.auth
    const actions = mapActions('auth', ['authenticate', 'logout'])
    const request = {strategy: 'local', email: 'test', password: 'test'}

    actions.authenticate.call({$store: store}, request)
    .then(authResponse => {
      actions.logout.call({$store: store})
      .then(response => {
        assert(authState.accessToken === undefined)
        assert(authState.errorOnAuthenticate === undefined)
        assert(authState.errorOnLogout === undefined)
        assert(authState.isAuthenticatePending === false)
        assert(authState.isLogoutPending === false)
        assert(authState.payload === undefined)
        done()
      })
    })
  })

  it('Authenticate with userService config option', (done) => {
    const store = new Vuex.Store({
      plugins: [
        auth({ userService: 'users' }),
        service('users')
      ]
    })
    feathersClient.service('authentication', {
      create (data) {
        return Promise.resolve({ accessToken })
      }
    })
    feathersClient.service('users', memory({store: {0: {id: 0, email: 'test@test.com'}}}))

    const authState = store.state.auth
    const actions = mapActions('auth', ['authenticate'])

    assert(authState.user === undefined)

    const request = {strategy: 'local', email: 'test', password: 'test'}
    actions.authenticate.call({$store: store}, request)
    .then(response => {
      let expectedUser = {
        id: 0,
        email: 'test@test.com'
      }
      assert.deepEqual(authState.user, expectedUser)
      done()
    })
    .catch(error => {
      assert(!error, error)
      done()
    })
  })
})
