import assert from 'chai/chai'
import 'steal-mocha'
import makeStore from './fixtures/store'
import feathersVuex from '../src/index'
import './service-module/service-module.test.js'
import './service-module/misconfigured-client.test.js'
import './service-module/actions.test.js'
import './service-module/mutations.test.js'
import './auth-module/auth-module.test.js'
import './auth-module/actions.test.js'

describe('feathers-vuex', () => {
  it('is CommonJS compatible', () => {
    assert(typeof feathersVuex === 'function')
  })

  it('basic functionality', () => {
    assert(typeof feathersVuex === 'function', 'It worked')
  })

  describe('Store', () => {
    it('responds to commits', () => {
      var store = makeStore()
      store.commit('increment')
      assert(store.state.count === 1)
    })
  })
})
