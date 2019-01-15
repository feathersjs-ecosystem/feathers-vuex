import { assert } from 'chai'
import feathersVuexAuth, { reducer } from '../src/auth'
import * as actionTypes from '../src/action-types'
import './server'
import { makeFeathersRestClient } from './feathers-client'

describe('feathers-vuex:auth', () => {
  it('is CommonJS compatible', () => {
    assert(typeof require('../lib/auth').default === 'function')
  })

  it('basic functionality', () => {
    assert(typeof feathersVuexAuth === 'function', 'It worked')
  })

  it('throws an error if the auth plugin is missing', () => {
    var app = {}
    var store = {}
    var plugin = feathersVuexAuth(store).bind(app)
    assert.throws(plugin, 'You must first register the @feathersjs/authentication-client plugin')
  })

  it('returns the app, is chainable', () => {
    var app = {
      authenticate () {}
    }
    var store = {}
    var returnValue = feathersVuexAuth(store).bind(app)()
    assert(returnValue === app)
  })

  it('replaces the original authenticate function', () => {
    const feathersClient = makeFeathersRestClient()
    const oldAuthenticate = feathersClient.authenticate
    const store = {}
    feathersClient.configure(feathersVuexAuth(store))
    assert(oldAuthenticate !== feathersClient.authenticate)
  })

  it('dispatches actions to the store.', (done) => {
    const feathersClient = makeFeathersRestClient()
    const fakeStore = {
      dispatch (action) {
        switch (action.type) {
          case actionTypes.FEATHERS_AUTH_REQUEST:
            assert(action.payload.test || action.payload.accessToken)
            break
          case actionTypes.FEATHERS_AUTH_SUCCESS:
            assert(action.data)
            break
          case actionTypes.FEATHERS_AUTH_FAILURE:
            assert(action.error)
            done()
            break
          case actionTypes.FEATHERS_AUTH_LOGOUT:
            assert(action)
            break
        }
      }
    }

    feathersClient.configure(feathersVuexAuth(fakeStore))

    try {
      feathersClient.authenticate({ test: true })
        .then(response => {
          feathersClient.logout()
          return response
        })
        .catch(error => {
          assert(error.className === 'not-authenticated')
        })
    } catch (err) {

    }
    try {
      feathersClient.authenticate({ strategy: 'jwt', accessToken: 'q34twershtdyfhgmj' })
    } catch (err) {
      console.log(err)
    }
  })
})

describe('feathers-vuex:auth - Reducer', () => {
  it('Has defaults', () => {
    const state = undefined
    const defaultState = {
      isPending: false,
      isError: false,
      isSignedIn: false,
      accessToken: null,
      error: undefined
    }
    const newState = reducer(state, {})
    assert.deepEqual(newState, defaultState)
  })

  it(`Responds to ${actionTypes.FEATHERS_AUTH_REQUEST}`, () => {
    const state = undefined
    const action = {
      type: actionTypes.FEATHERS_AUTH_REQUEST,
      payload: {
        strategy: 'jwt',
        accessToken: 'evh8vq2pj'
      }
    }
    const expectedState = {
      isPending: true,
      isError: false,
      isSignedIn: false,
      accessToken: null,
      error: undefined
    }
    const newState = reducer(state, action)
    assert.deepEqual(newState, expectedState)
  })

  it(`Responds to ${actionTypes.FEATHERS_AUTH_SUCCESS}`, () => {
    const state = undefined
    const accessToken = 'evh8vq2pj'
    const action = {
      type: actionTypes.FEATHERS_AUTH_SUCCESS,
      data: { accessToken }
    }
    const expectedState = {
      isPending: false,
      isError: false,
      isSignedIn: true,
      accessToken: accessToken,
      error: undefined
    }
    const newState = reducer(state, action)
    assert.deepEqual(newState, expectedState)
  })

  it(`Responds to ${actionTypes.FEATHERS_AUTH_FAILURE}`, () => {
    const state = undefined
    const error = 'Unauthorized'
    const action = {
      type: actionTypes.FEATHERS_AUTH_FAILURE,
      error
    }
    const expectedState = {
      isPending: false,
      isError: true,
      isSignedIn: false,
      accessToken: null,
      error
    }
    const newState = reducer(state, action)
    assert.deepEqual(newState, expectedState)
  })

  it(`Responds to ${actionTypes.FEATHERS_AUTH_LOGOUT}`, () => {
    const state = undefined
    const action = {
      type: actionTypes.FEATHERS_AUTH_LOGOUT
    }
    const expectedState = {
      isPending: false,
      isError: false,
      isSignedIn: false,
      accessToken: null,
      error: undefined
    }
    const newState = reducer(state, action)
    assert.deepEqual(newState, expectedState)
  })
})
