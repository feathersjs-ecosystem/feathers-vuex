/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { assert } from 'chai'
import feathersVuex from '../../src/index'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex from 'vuex'
import { isEmpty } from 'lodash'

const { makeAuthPlugin, makeServicePlugin, BaseModel } = feathersVuex(
  feathersClient,
  {
    serverAlias: 'api'
  }
)
interface CustomStore {
  state: any
  auth: any
  authentication?: any
  users?: any
}

function makeContext() {
  class User extends BaseModel {
    constructor(data, options) {
      super(data, options)
    }
    static modelName = 'User'
    static instanceDefaults() {
      return {
        email: '',
        password: ''
      }
    }
  }
  const servicePath = 'users'
  const usersPlugin = makeServicePlugin({
    Model: User,
    service: feathersClient.service(servicePath),
    servicePath
  })

  const authPlugin = makeAuthPlugin({ userService: 'users' })

  const store = new Vuex.Store<CustomStore>({
    plugins: [authPlugin, usersPlugin]
  })

  return { User, usersPlugin, authPlugin, BaseModel, store }
}

describe('Auth Module', () => {
  describe('Configuration', () => {
    it('has default auth namespace', () => {
      const { store } = makeContext()
      const authState = Object.assign({}, store.state.auth)
      const expectedCustomStore = {
        accessToken: null,
        entityIdField: 'userId',
        errorOnAuthenticate: null,
        errorOnLogout: null,
        isAuthenticatePending: false,
        isLogoutPending: false,
        payload: null,
        responseEntityField: 'user',
        serverAlias: 'api',
        user: null,
        userService: 'users'
      }

      assert.deepEqual(authState, expectedCustomStore, 'has the default state')
    })

    it('can customize the namespace', function() {
      const store = new Vuex.Store<CustomStore>({
        plugins: [makeAuthPlugin({ namespace: 'authentication' })]
      })

      assert(store.state.authentication, 'the custom namespace was used')
    })
  })

  describe('Customizing Auth Store', function() {
    it('allows adding custom state', function() {
      const customState = {
        test: true,
        test2: {
          test: true
        }
      }
      const store = new Vuex.Store<CustomStore>({
        plugins: [makeAuthPlugin({ state: customState })]
      })

      assert(store.state.auth.test === true, 'added custom state')
      assert(store.state.auth.test2.test === true, 'added custom state')
    })

    it('allows custom mutations', function() {
      const state = { test: true }
      const customMutations = {
        setTestToFalse(state) {
          state.test = false
        }
      }
      const store = new Vuex.Store<CustomStore>({
        plugins: [makeAuthPlugin({ state, mutations: customMutations })]
      })

      store.commit('auth/setTestToFalse')
      assert(
        store.state.auth.test === false,
        'the custom state was modified by the custom mutation'
      )
    })

    it('has a user && isAuthenticated getter when there is a userService attribute', function() {
      const store = new Vuex.Store<CustomStore>({
        state: {
          state: {},
          auth: {},
          users: {
            idField: 'id',
            keyedById: {
              1: {
                id: 1,
                name: 'Marshall'
              }
            }
          }
        },
        plugins: [
          makeAuthPlugin({
            state: {
              user: {
                id: 1
              }
            },
            userService: 'users'
          })
        ]
      })
      const user = store.getters['auth/user']
      const isAuthenticated = store.getters['auth/isAuthenticated']

      assert(user.name === 'Marshall', 'Got the user from the users store.')
      assert(isAuthenticated, 'isAuthenticated')
    })

    it('getters show not authenticated when there is no user', function() {
      const store = new Vuex.Store<CustomStore>({
        state: {
          state: {},
          auth: {},
          users: {
            idField: 'id',
            keyedById: {}
          }
        },
        plugins: [
          makeAuthPlugin({
            state: {},
            userService: 'users'
          })
        ]
      })
      const user = store.getters['auth/user']
      const isAuthenticated = store.getters['auth/isAuthenticated']

      assert(user === null, 'user getter returned null as expected')
      assert(!isAuthenticated, 'not authenticated')
    })

    it('allows custom getters', function() {
      const customGetters = {
        oneTwoThree() {
          return 123
        }
      }
      const store = new Vuex.Store<CustomStore>({
        plugins: [makeAuthPlugin({ getters: customGetters })]
      })

      assert(
        store.getters['auth/oneTwoThree'] === 123,
        'the custom getter was available'
      )
    })

    it('allows adding custom actions', function() {
      const config = {
        state: {
          isTrue: false
        },
        mutations: {
          setToTrue(state) {
            state.isTrue = true
          }
        },
        actions: {
          trigger(context) {
            context.commit('setToTrue')
          }
        }
      }
      const store = new Vuex.Store<CustomStore>({
        plugins: [makeAuthPlugin(config)]
      })

      store.dispatch('auth/trigger')
      assert(store.state.auth.isTrue === true, 'the custom action was run')
    })
  })

  it('Calls auth service without params', async function() {
    let receivedData = null
    let receivedParams = null
    feathersClient.use('authentication', {
      create(data, params) {
        receivedData = data
        receivedParams = params
        return Promise.resolve({ accessToken: 'jg54jh2gj6fgh734j5h4j25jbh' })
      }
    })

    const { store } = makeContext()

    const request = { strategy: 'local', email: 'test', password: 'test' }
    await store.dispatch('auth/authenticate', request)
    assert(receivedData, 'got data')
    assert(receivedData.strategy === 'local', 'got strategy')
    assert(receivedData.email === 'test', 'got email')
    assert(receivedData.password === 'test', 'got password')
    assert(receivedParams && isEmpty(receivedParams), 'empty params')
  })

  it('Calls auth service with params', async function() {
    let receivedParams = null
    feathersClient.use('authentication', {
      create(data, params) {
        receivedParams = params
        return Promise.resolve({ accessToken: 'jg54jh2gj6fgh734j5h4j25jbh' })
      }
    })

    const { store } = makeContext()

    const request = { strategy: 'local', email: 'test', password: 'test' }
    const customParams = { theAnswer: 42 }
    await store.dispatch('auth/authenticate', [request, customParams])
    assert(receivedParams && receivedParams.theAnswer === 42, 'got params')
  })
})
