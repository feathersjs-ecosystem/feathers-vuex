
import chai from 'chai/chai'
import { isNode, isBrowser } from '../src/utils'

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
