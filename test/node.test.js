
import chai from 'chai/chai'
import 'steal-mocha'
import store from './fixtures/store'
// import feathersVuex from '../src/index'
// require('./vuex.test.js')

const assert = chai.assert

describe('feathers-vuex', () => {
  it('is CommonJS compatible', () => {
    assert(typeof require('../lib') === 'function')
  })

  it('basic functionality', () => {
    assert(typeof feathersVuex === 'function', 'It worked')
  })

  describe('Store', () => {
    it('responds to commits', () => {
      var state = store.state
      store.commit('increment')
      assert(state.count === 1)
    })
  })
})
