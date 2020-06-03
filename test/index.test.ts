import { assert } from 'chai'
import * as feathersVuex from '../src/index'

describe('feathers-vuex', () => {
  it('has correct exports', () => {
    assert(typeof feathersVuex.default === 'function')
    assert(
      typeof feathersVuex.FeathersVuex.install === 'function',
      'has Vue Plugin'
    )
    assert(feathersVuex.FeathersVuexFind)
    assert(feathersVuex.FeathersVuexGet)
    assert(feathersVuex.initAuth)
    assert(feathersVuex.makeFindMixin)
    assert(feathersVuex.makeGetMixin)
    assert(feathersVuex.models)
  })

  it('requires a Feathers Client instance', () => {
    try {
      feathersVuex.default({}, { serverAlias: 'index-test' })
    } catch (error) {
      assert.equal(
        error.message,
        'The first argument to feathersVuex must be a feathers client.'
      )
    }
  })
})
