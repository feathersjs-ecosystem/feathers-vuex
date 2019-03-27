import { assert } from 'chai'
import * as feathersVuex from '../src/index'
import { feathersSocketioClient as feathersClient } from './fixtures/feathers-client'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

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
      feathersVuex.default(
        {},
        {
          serverAlias: 'index-test'
        }
      )
    } catch (error) {
      assert(
        error.message ===
          'The first argument to feathersVuex must be a feathers client.'
      )
    }
  })
})
