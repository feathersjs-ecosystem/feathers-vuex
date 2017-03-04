import { assert } from 'chai'
import store from './store'
import feathersVuex from '../src/index'
// import './auth.test.js';
import './services.test.js'
// import './vuex.test.js';

describe('feathers-vuex', () => {
  it('is CommonJS compatible', () => {
    assert(typeof require('../lib') === 'function')
  })

  it('basic functionality', () => {
    assert(typeof feathersVuex === 'function', 'It worked')
  })

  it('throws an error if the auth plugin is missing', () => {
    var app = {}
    var store = {}
    var plugin = feathersVuex(store).bind(app)
    assert.throws(plugin, 'You must first register the feathers-authentication-client plugin')
  })

  describe('Store', () => {
    it('responds to commits', () => {
      var state = store.state
      store.commit('increment')
      assert(state.count === 1)
    })
  })
})
