import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'

describe('Service Module', () => {
  describe('Configuration', () => {
    it('service has vuexOptions', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      const service = feathersClient.service('todos')
      assert(service.vuexOptions)
    })

    it('vuexOptions has global defaults', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      const service = feathersClient.service('todos')
      const { global } = service.vuexOptions
      const expectedGlobal = {
        idField: 'id',
        auto: true,
        autoForce: false,
        nameStyle: 'short',
        feathers: {
          namespace: 'feathers'
        },
        auth: {
          namespace: 'auth',
          userService: '',
          state: {},
          getters: {},
          mutations: {},
          actions: {}
        }
      }
      assert.deepEqual(global, expectedGlobal)
    })

    it('service has vuexOptions module defaults', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      const service = feathersClient.service('todos')
      const options = service.vuexOptions.module
      const expectedOptions = {
        namespace: 'todos'
      }
      assert.deepEqual(options, expectedOptions)
    })

    it('can globally set the idField', () => {
      const store = makeStore()
      const idField = '___idField'
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {idField}))
      const service = feathersClient.service('todos')

      const moduleOptions = service.vuexOptions.module
      const expectedOptions = {
        namespace: 'todos'
      }
      assert.deepEqual(moduleOptions, expectedOptions)

      const globalOptions = service.vuexOptions.global
      assert(globalOptions.idField === idField)
    })

    it('service short name alias is properly created', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      const service = feathersClient.service('api/animals')
      const options = service.vuexOptions.module
      const expectedOptions = {
        namespace: 'animals'
      }
      assert.deepEqual(options, expectedOptions)
    })

    it('can override default name', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {nameStyle: 'path'}))
      const service = feathersClient.service('api/animals').vuex({namespace: 'animales'})
      const options = service.vuexOptions.module
      const expectedOptions = {
        namespace: 'animales',
        oldName: 'api/animals'
      }
      assert.deepEqual(options, expectedOptions)
    })

    it('can set default name to path', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {nameStyle: 'path'}))
      const service = feathersClient.service('api/animals')
      const options = service.vuexOptions.module
      const expectedOptions = {
        namespace: 'api/animals'
      }
      assert.deepEqual(options, expectedOptions)
    })

    it('can require names to be explicitly set', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {nameStyle: 'explicit'}))
      try {
        feathersClient.service('api/animals')
      } catch (error) {
        assert(error.message === 'The feathers-vuex nameStyle attribute is set to explicit, but no name was provided for the api/animals service.')
      }
    })
  })

  describe('Basics', () => {
    it('Creating a service adds its module to the store', () => {
      const store = makeStore()
      makeFeathersRestClient()
        .configure(feathersVuex(store))
        .service('todos')
      assert(store.state.todos)
    })

    it('populates default todos data', () => {
      const store = makeStore()
      makeFeathersRestClient()
        .configure(feathersVuex(store, {idField: '_id'}))
        .service('todos')

      const todoState = store.state.todos

      assert(todoState.ids.length === 0)
      assert(todoState.isPending === false)
      assert(todoState.isError === false)
      assert(todoState.error === undefined)
      assert(todoState.idField === '_id')
      assert.deepEqual(todoState.keyedById, {})
    })
  })
})
