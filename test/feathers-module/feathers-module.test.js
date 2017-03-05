import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'

describe('Feathers Module', () => {
  describe('Configuration', () => {
    it('allows customizing the feathers module name', () => {
      const store = makeStore()
      const feathersModuleName = 'Feathaz'
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, { feathersModuleName }))
      const service = feathersClient.service('todos')
      const options = service.vuexOptions.global
      assert(options.feathersModuleName === feathersModuleName)
    })
  })

  describe('Basics', () => {
    it('The feathers module gets added to the store', () => {
      const store = makeStore()
      makeFeathersRestClient().configure(feathersVuex(store))
      assert.deepEqual({services: {}}, store.state.feathers)
    })

    it('populates with new services', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      var todoService = feathersClient.service('api/todos')
      assert(store.state.feathers.services['api/todos'] === todoService)
    })
  })
})
