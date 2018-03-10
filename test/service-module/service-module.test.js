import assert from 'chai/chai'
import setupVuexService from '~/src/service-module/service-module'
import { makeFeathersRestClient, feathersRestClient as feathersClient, feathersSocketioClient } from '../fixtures/feathers-client'
import { stripSlashes } from '../../src/utils'
import memory from 'feathers-memory'
import makeTodos from '../fixtures/todos'
import Vuex from 'vuex'

const globalModels = {}
const service = setupVuexService(feathersClient, {}, globalModels)

describe('Service Module', () => {
  it('registers a vuex plugin and Model for the service', () => {
    const serviceName = 'todos'
    const store = new Vuex.Store({
      plugins: [service(serviceName)]
    })
    assert(globalModels.hasOwnProperty('Todo'), 'the Model was added to the globalModels')

    const todo = new globalModels.Todo({
      description: 'Do the dishes',
      isComplete: false
    })
    assert(todo instanceof globalModels.Todo, 'Model can be instantiated.')

    assert(store.state[serviceName])
  })

  describe('Models', function () {
    beforeEach(function () {
      const serviceName = 'todos'
      const store = new Vuex.Store({
        plugins: [service(serviceName)]
      })
      assert(store)
      assert(globalModels.hasOwnProperty('Todo'), 'the Model was added to the globalModels')

      const data = {
        id: 1,
        description: 'Do the dishes',
        isComplete: false
      }
      store.commit('todos/addItem', data)

      const todo = store.state.todos.keyedById[1]

      this.todo = todo
      this.todoClone = todo.clone()
    })

    it('allows creating model clones', function () {
      const { todoClone } = this

      assert(todoClone.isClone, 'created a todo clone with isClone attribute')
      assert(todoClone instanceof globalModels.Todo, 'the copy is an instance of the same class')
    })

    it('allows modifying clones without affecting the original', function () {
      const { todo, todoClone } = this

      todoClone.description = 'Do something else'

      assert(todo.description === 'Do the dishes', 'the original todo remained intact')
    })

    it('allows commiting changes back to the original in the store', function () {
      const { todo, todoClone } = this

      todoClone.description = 'Do something else'
      todoClone.commit()

      assert(todo.description === 'Do something else', 'the original todo was updated')
    })

    it('allows reseting copy changes back to match the original', function () {
      const { todo, todoClone } = this

      todoClone.description = 'Do something else'
      todoClone.reset()

      assert(todo.description === 'Do the dishes', 'the original todo was untouched')
      assert(todoClone.description === 'Do the dishes', 'the clone was reset to match the original')
    })
  })

  describe('Models - Default Values', function () {
    beforeEach(function () {
      const taskDefaults = this.taskDefaults = {
        id: null,
        description: '',
        isComplete: false
      }
      this.store = new Vuex.Store({
        plugins: [
          service('todos'),
          service('tasks', {
            instanceDefaults: taskDefaults
          })
        ]
      })
      this.Todo = globalModels.Todo
      this.Task = globalModels.Task
    })

    // store.commit('todos/addItem', data)

    it('models default to an empty object', function () {
      const { Todo } = this
      const todo = new Todo()

      assert.deepEqual(todo, {}, 'default model is an empty object')
    })

    it('allows customizing the default values for a model', function () {
      const { Task, taskDefaults } = this
      const task = new Task()

      assert.deepEqual(task, taskDefaults, 'the instance had the customized values')
    })

    it('keeps the options on the Model', function () {
      const { Task, taskDefaults } = this
      const options = {
        actions: {},
        apiPrefix: '',
        autoRemove: false,
        debug: false,
        enableEvents: true,
        getters: {},
        idField: 'id',
        instanceDefaults: taskDefaults,
        modelPath: '',
        mutations: {},
        nameStyle: 'short',
        preferUpdate: false,
        replaceItems: false,
        state: {}
      }

      assert.deepEqual(Task.options, options, 'The Model.options object should be in place')
    })
  })

  describe('Setting Up', () => {
    it('service stores have global defaults', () => {
      const store = new Vuex.Store({
        plugins: [
          service('tasks'),
          service('/v2/todos')
        ]
      })
      const { state } = store

      assert(state.tasks.idField === 'id', 'default idField is `id`')
      assert(state.tasks.autoRemove === false, 'autoRemove is off by default')
      assert(state.todos, 'uses `short` nameStyle by default')
    })

    it('can customize the idField for each service', function () {
      const idField = '_id'
      const store = new Vuex.Store({
        plugins: [
          service('tests', { idField })
        ]
      })

      assert(store.state.tests.idField === idField, 'the idField was properly set')
    })

    it('allows enabling autoRemove', function () {
      const autoRemove = true
      const store = new Vuex.Store({
        plugins: [
          service('tests', { autoRemove })
        ]
      })

      assert(store.state.tests.autoRemove === autoRemove, 'the autoRemove was enabled')
    })

    it('can switch to path name as namespace', () => {
      const nameStyle = 'path'
      const serviceName = '/v1/tests'
      const store = new Vuex.Store({
        plugins: [
          service(serviceName, { nameStyle })
        ]
      })
      const namespace = stripSlashes(serviceName)

      assert(store.state[namespace], 'the full path name was used as a namespace')
    })

    it('can explicitly provide a namespace', () => {
      const namespace = 'blah'
      const store = new Vuex.Store({
        plugins: [
          service('/v1/tests', { namespace })
        ]
      })
      assert(store.state.blah, 'the namespace option was used as the namespace')
    })

    it('prioritizes the explicit namespace', () => {
      const namespace = 'blah'
      const nameStyle = 'path'
      const store = new Vuex.Store({
        plugins: [
          service('/v1/tests', { namespace, nameStyle })
        ]
      })
      assert(store.state.blah, 'the namespace option was used as the namespace')
    })
  })

  describe('Basics', () => {
    beforeEach(function () {
      this.feathersClient = makeFeathersRestClient()
      this.feathersClient.service('todos', memory({store: makeTodos()}))
      this.service = setupVuexService(this.feathersClient)
    })

    it('populates default store', () => {
      const store = new Vuex.Store({
        plugins: [
          service('todos')
        ]
      })
      const todoState = store.state.todos
      const expectedState = {
        autoRemove: false,
        copy: null,
        currentId: null,
        enableEvents: true,
        errorOnCreate: null,
        errorOnGet: null,
        errorOnPatch: null,
        errorOnRemove: null,
        errorOnUpdate: null,
        errorOnFind: null,
        idField: 'id',
        ids: [],
        isFindPending: false,
        isGetPending: false,
        isCreatePending: false,
        isUpdatePending: false,
        isPatchPending: false,
        isRemovePending: false,
        keyedById: {},
        copiesById: {},
        modelPath: 'Todo',
        preferUpdate: false,
        servicePath: 'todos'
      }

      assert.deepEqual(todoState, expectedState, 'the expected state was returned')
    })

    it('throws an error if first arg is not a string', function () {
      const { service } = this
      try {
        new Vuex.Store({ // eslint-disable-line no-new
          plugins: [
            service({})
          ]
        })
      } catch (error) {
        assert(error.message === 'The first argument to setup a feathers-vuex service must be a string', 'threw an error')
      }
    })

    it(`populates items on find`, function (done) {
      const store = new Vuex.Store({
        plugins: [
          this.service('todos', { idField: '_id' })
        ]
      })

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
      beforeEach(function () {
        this.feathersClient = makeFeathersRestClient()
        this.feathersClient.service('todos', memory({
          store: makeTodos()
        }))
        this.feathersClient.service('tasks', memory({
          store: makeTodos(),
          paginate: {
            default: 10,
            max: 50
          }
        }))
        this.service = setupVuexService(this.feathersClient)
      })

      it(`removes missing items when pagination is off`, function (done) {
        const store = new Vuex.Store({
          plugins: [
            this.service('todos', { idField: '_id', autoRemove: true })
          ]
        })

        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store.dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('todos').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(todoState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(todoState.ids.length === 2, 'there are now two items in the store')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when pagination is on`, function (done) {
        const store = new Vuex.Store({
          plugins: [
            this.service('tasks', { idField: '_id', autoRemove: true })
          ]
        })

        const taskState = store.state.tasks

        assert(taskState.ids.length === 0)

        // Load some data into the store
        store.dispatch('tasks/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('tasks').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(taskState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('tasks/find', { query: {} })
          })
          .then(todos => {
            assert(todos.hasOwnProperty('total'), 'pagination is on')
            assert(taskState.ids.length === 3, 'there are still three items in the store')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when autoRemove is off`, function (done) {
        const store = new Vuex.Store({
          plugins: [
            this.service('todos', { idField: '_id', autoRemove: false })
          ]
        })
        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store.dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('todos').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(todoState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
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
      const customState = {
        test: true,
        test2: {
          test: true
        }
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', { state: customState })
        ]
      })

      assert(store.state.todos.test === true, 'added custom state')
      assert(store.state.todos.test2.test === true, 'added custom state')
    })

    it('allows custom mutations', function () {
      const state = { test: true }
      const customMutations = {
        setTestToFalse (state) {
          state.test = false
        }
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', { state, mutations: customMutations })
        ]
      })

      store.commit('todos/setTestToFalse')
      assert(store.state.todos.test === false, 'the custom state was modified by the custom mutation')
    })

    it('allows custom getters', function () {
      const customGetters = {
        oneTwoThree (state) {
          return 123
        }
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', { getters: customGetters })
        ]
      })

      assert(store.getters['todos/oneTwoThree'] === 123, 'the custom getter was available')
    })

    it('allows adding custom actions', function () {
      const config = {
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
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', config)
        ]
      })

      store.dispatch('todos/trigger')
      assert(store.state.todos.isTrue === true, 'the custom action was run')
    })
  })

  describe.skip('Updates the Store on Events', function () {
    const socketService = setupVuexService(feathersSocketioClient)

    it('created', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      feathersSocketioClient.service('things').on('created', item => {
        assert(store.state.things.keyedById[0].test, 'the item received from the socket event was added to the store')
        done()
      })

      feathersSocketioClient.service('things').create({ test: true })
    })

    it('patched', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('patched', item => {
        assert(store.state.things.keyedById[1].test, 'the item received from the socket event was updated in the store')
        done()
      })

      feathersSocketioClient.service('things').patch(1, { test: true })
    })

    it('updated', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('updated', item => {
        assert(store.state.things.keyedById[1].test, 'the item received from the socket event was updated in the store')
        done()
      })

      feathersSocketioClient.service('things').update(1, { test: true })
    })

    it('removed', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('removed', item => {
        assert(!store.state.things.keyedById[1], 'the item received from the socket event was removed from the store')
        done()
      })

      feathersSocketioClient.service('things').remove(1)
    })
  })
})
