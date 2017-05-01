import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { isNode, isBrowser } from '../../src/utils'
import { makeFeathersRestClient } from '../fixtures/feathers-client'

describe('Feathers Module', () => {
  describe('Configuration', () => {
    it('allows customizing the feathers module name', () => {
      const store = makeStore()
      const namespace = 'Feathaz'
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, { feathers: { namespace } }))
      const service = feathersClient.service('todos')
      const options = service.vuexOptions.global
      assert(options.feathers.namespace === namespace)
    })

    it('can turn off automatic setup of Feathers services', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {auto: false}))
      feathersClient.service('api/animals')
      const services = store.state.feathers.services

      assert(services.all)
      assert(services.vuex)
      assert(!services.vuex.animals)
    })
  })

  describe('Basics', () => {
    it('The feathers module gets added to the store', () => {
      const store = makeStore()
      makeFeathersRestClient().configure(feathersVuex(store))
      const expected = {
        services: {
          vuex: {},
          all: {}
        }
      }
      assert.deepEqual(expected, store.state.feathers)
    })

    it('has a map of all feathers services', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      var todoService = feathersClient.service('api/todos')
      assert(store.state.feathers.services.all['api/todos'] === todoService)
    })

    it('adds new vuex services to the services.vuex attribute', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      var todoService = feathersClient.service('api/todos')
      assert(store.state.feathers.services.vuex['api/todos'] === todoService)
    })
  })

  describe('Utils', () => {
    it('sets isNode to false', () => {
      assert(!isNode, 'isNode was false')
    })

    it('sets isBrowser to true', () => {
      assert(isBrowser, 'isBrowser was true')
    })
  })
})
