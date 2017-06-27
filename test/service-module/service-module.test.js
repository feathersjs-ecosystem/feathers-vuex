import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'
import memory from 'feathers-memory'
import makeTodos from '../fixtures/todos'

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
        autoRemove: false,
        nameStyle: 'short',
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
        .service('todos', memory())

      const todoState = store.state.todos

      assert(todoState.ids.length === 0)
      assert(todoState.error === undefined)
      assert(todoState.idField === '_id')
      assert.deepEqual(todoState.keyedById, {})
    })

    it(`populates items on find`, function (done) {
      const store = makeStore()
      makeFeathersRestClient()
        .configure(feathersVuex(store, {idField: '_id'}))
        .service('todos', memory({store: makeTodos()}))

      const todoState = store.state.todos

      assert(todoState.ids.length === 0)

      store.dispatch('todos/find', { query: {} })
        .then(todos => {
          assert(todoState.ids.length === 3)
          done()
        })
        .catch(error => {
          assert(!error, error.message)
          done()
        })
    })

    describe('Auto-remove items', function () {
      it(`removes missing items when pagination is off`, function (done) {
        const store = makeStore()
        const todoService = makeFeathersRestClient()
          .configure(feathersVuex(store, {
            idField: '_id',
            autoRemove: true
          }))
          .service('todos', memory({store: makeTodos()}))

        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store.dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            return todoService.remove(3)
          })
          .then(response => {
            // We went around using the store actions, so there will still be three items.
            assert(todoState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(!todos.hasOwnProperty('total'), 'pagination is off')
            assert(todoState.ids.length === 2, 'there are now two items in the store')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when pagination is on`, function (done) {
        const store = makeStore()
        const todoService = makeFeathersRestClient()
          .configure(feathersVuex(store, {idField: '_id'}))
          .service('todos', memory({
            store: makeTodos(),
            paginate: {
              default: 10,
              max: 50
            }
          }))

        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store.dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            return todoService.remove(3)
          })
          .then(response => {
            // We went around using the store actions, so there will still be three items.
            assert(todoState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(todos.hasOwnProperty('total'), 'pagination is on')
            assert(todoState.ids.length === 3, 'there are still three items in the store')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when autoRemove is off`, function (done) {
        const store = makeStore()
        const todoService = makeFeathersRestClient()
          .configure(feathersVuex(store, {idField: '_id', autoRemove: false}))
          .service('todos', memory({ store: makeTodos() }))

        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store.dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            return todoService.remove(3)
          })
          .then(response => {
            // We went around using the store actions, so there will still be three items.
            assert(todoState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(!todos.hasOwnProperty('total'), 'pagination is off')
            assert(todoState.ids.length === 3, 'there are still three items in the store')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })
    })
  })

  describe('Customizing Service Stores', function () {
    it('allows adding custom state', function () {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {idField: '_id'}))
      const service = feathersClient.service('todos', {
        state: makeTodos()
      })

      service.vuex({
        state: {
          thisIsATest: true
        }
      })

      assert(store.state.todos.thisIsATest === true, 'the custom state was mixed into the store')
    })

    it('allows adding custom mutations', function () {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {idField: '_id'}))
      const service = feathersClient.service('todos', {
        state: makeTodos()
      })

      service.vuex({
        state: {
          thisIsATest: true
        },
        mutations: {
          disableThisIsATest (state) {
            state.thisIsATest = false
          }
        }
      })

      store.commit('todos/disableThisIsATest')
      assert(store.state.todos.thisIsATest === false, 'the custom state was modified by the custom mutation')
    })

    it('allows adding custom getters', function () {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {idField: '_id'}))
      const service = feathersClient.service('todos', {
        state: makeTodos()
      })

      service.vuex({
        getters: {
          oneTwoThree (state) {
            return 123
          }
        }
      })

      assert(store.getters['todos/oneTwoThree'] === 123, 'the custom getter was available')
    })

    it('allows adding custom actions', function () {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store, {idField: '_id'}))
      const service = feathersClient.service('todos', {
        state: makeTodos()
      })

      service.vuex({
        state: {
          isTrue: false
        },
        mutations: {
          setToTrue (state) {
            state.isTrue = true
          }
        },
        actions: {
          trigger (context) {
            context.commit('setToTrue')
          }
        }
      })

      store.dispatch('todos/trigger')
      assert(store.state.todos.isTrue === true, 'the custom action was run')
    })
  })
})
