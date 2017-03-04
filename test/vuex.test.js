import { assert } from 'chai'
import feathersVuex from '../src/index'
import store from './store'
import { makeFeathersRestClient } from './feathers-client'

describe('Using with Vuex', () => {
  describe('Auth', () => {
    it('reducer populates the store with default data', () => {
      const expectedStateBeforeAuthInit = {
        accessToken: undefined,
        error: undefined,
        isError: false,
        isLoading: false,
        isSignedIn: false
      }

      var currentState = store.getState().auth
      assert.deepEqual(currentState, expectedStateBeforeAuthInit)
    })

    it(`populates the store properly after auth & logout`, (done) => {
      const feathersClient = makeFeathersRestClient()

      feathersClient.configure(feathersVuex(store))
      feathersClient.authenticate({strategy: 'jwt', accessToken: '12345'})
        .then(response => {
          const expectedStateAfterAuthSuccess = {
            accessToken: response.accessToken,
            error: undefined,
            isError: false,
            isLoading: false,
            isSignedIn: true
          }
          var currentState = store.getState().auth
          assert.deepEqual(currentState, expectedStateAfterAuthSuccess)

          // Test logout
          feathersClient.logout().then(() => {
            const expectedStateAfterLogout = {
              accessToken: undefined,
              error: undefined,
              isError: false,
              isLoading: false,
              isSignedIn: false
            }
            currentState = store.getState().auth
            assert.deepEqual(currentState, expectedStateAfterLogout)
            done()
          })
        })

      const expectedStateAfterAuthInit = {
        accessToken: undefined,
        error: undefined,
        isError: false,
        isLoading: true,
        isSignedIn: false
      }
      var currentState = store.getState().auth
      assert.deepEqual(currentState, expectedStateAfterAuthInit)
    })

    it(`populates the store properly after failed auth`, (done) => {
      const feathersClient = makeFeathersRestClient()

      feathersClient.configure(feathersVuex(store))
      feathersClient.authenticate()
        .catch(error => {
          const expectedStateAfterAuthFailure = {
            accessToken: undefined,
            error,
            isError: true,
            isLoading: false,
            isSignedIn: false
          }
          var currentState = store.getState().auth
          assert.deepEqual(currentState, expectedStateAfterAuthFailure)
          done()
        })
    })
  })

  describe('Services', () => {
    describe('services reducer', () => {
      it('default is empty object', () => {
        var state = store.getState()
        assert.deepEqual({}, state.services)
      })

      it('populates with new services', () => {
        const feathersClient = makeFeathersRestClient()

        feathersClient.configure(feathersVuex(store))
        var todoService = feathersClient.service('api/todos')
        var state = store.getState()
        assert(state.services['api/todos'] === todoService)
      })
    })
  })

  describe('services data reducer', () => {
    it('populates default todos data', () => {
      makeFeathersRestClient()
        .configure(feathersVuex(store))
        .service('todos')

      const state = store.getState().todos

      assert(state.data.length === 0)
      assert(state.isLoading === false)
      assert(state.isError === false)
      assert(state.error === undefined)
      assert(state.idProp === '_id')
      assert.deepEqual(state.byIds, {})
    })

    it('populates default todos data', (done) => {
      const feathersClient = makeFeathersRestClient().configure(feathersVuex(store))
      const todoService = feathersClient.service('todos')

      todoService.create({description: 'Do the laundry'})
        .then(response => {
          var state = store.getState().todos
          assert(state.data.length === 1)
          assert(state.isLoading === false)
          assert(state.isError === false)
          assert(state.error === undefined)
          done()
        })

      var state = store.getState().todos
      assert(state.data.length === 0)
      assert(state.isLoading === true)
      assert(state.isError === false)
      assert(state.error === undefined)
      assert(state.idProp === '_id')
      assert.deepEqual(state.byIds, {})
    })
  })
})
