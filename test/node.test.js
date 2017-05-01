
import chai from 'chai/chai'
import store from './fixtures/store'
import { isNode, isBrowser } from '../src/utils'
// import feathersVuex from '../src/index'
// require('./vuex.test.js')

const assert = chai.assert

describe('feathers-vuex', () => {
  describe('Utils', () => {
    it('sets isNode to true', () => {
      assert(isNode, 'isNode was true')
    })

    it('sets isBrowser to false', () => {
      assert(!isBrowser, 'isBrowser was false')
    })
  })
})
