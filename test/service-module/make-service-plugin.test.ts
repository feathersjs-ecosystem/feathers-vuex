/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import { ServiceState } from './types'
import { clearModels } from '../../src/service-module/global-models'
import { clients } from '../../src/service-module/global-clients'
import { feathersRestClient as feathers } from '../../test/fixtures/feathers-client'
import feathersVuex from '../../src/index'
import _pick from 'lodash/pick'
import _omit from 'lodash/omit'

Vue.use(Vuex)

describe('makeServicePlugin', function () {
  beforeEach(() => {
    clearModels()
  })

  it('adds Feathers client to the global clients', () => {
    feathersVuex(feathers, {
      serverAlias: 'this is a test'
    })
    assert(clients.byAlias['this is a test'], 'got a reference to the client.')
  })

  it('registers the vuex module with options', function () {
    interface RootState {
      todos: {}
    }

    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
      serverAlias
    })
    const servicePath = 'todos'
    class Todo extends BaseModel {
      public static modelName = 'Todo'
      public static servicePath = servicePath
    }
    const todosPlugin = makeServicePlugin({
      servicePath,
      Model: Todo,
      service: feathers.service(servicePath)
    })
    const store = new Vuex.Store<RootState>({ plugins: [todosPlugin] })

    const keys = Object.keys(store.state.todos)
    const received = _pick(store.state.todos, keys)
    const expected = {
      addOnUpsert: false,
      autoRemove: false,
      debug: false,
      copiesById: {},
      enableEvents: true,
      errorOnCreate: null,
      errorOnFind: null,
      errorOnGet: null,
      errorOnPatch: null,
      errorOnRemove: null,
      errorOnUpdate: null,
      idField: 'id',
      tempIdField: '__id',
      ids: [],
      isCreatePending: false,
      isFindPending: false,
      isGetPending: false,
      isPatchPending: false,
      isRemovePending: false,
      isUpdatePending: false,
      keepCopiesInStore: false,
      debounceEventsTime: null,
      debounceEventsMaxWait: 1000,
      keyedById: {},
      modelName: 'Todo',
      nameStyle: 'short',
      namespace: 'todos',
      pagination: {
        defaultLimit: null,
        defaultSkip: null
      },
      paramsForServer: ['$populateParams'],
      preferUpdate: false,
      replaceItems: false,
      serverAlias: 'default',
      servicePath: 'todos',
      skipRequestIfExists: false,
      tempsById: {},
      whitelist: [],
      isIdCreatePending: [],
      isIdUpdatePending: [],
      isIdPatchPending: [],
      isIdRemovePending: [],
    }

    assert.deepEqual(_omit(received), _omit(expected), 'defaults in place.')
  })

  it('sets up Model.store && service.FeathersVuexModel', function () {
    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
      serverAlias
    })

    const servicePath = 'todos'
    const service = feathers.service(servicePath)
    class Todo extends BaseModel {
      public static modelName = 'Todo'
      public static servicePath = servicePath
    }
    const todosPlugin = makeServicePlugin({ servicePath, Model: Todo, service })
    const store = new Vuex.Store({ plugins: [todosPlugin] })

    assert(Todo.store === store, 'the store is on the Model!')
    // @ts-ignore
    assert.equal(service.FeathersVuexModel, Todo, 'Model accessible on service')
  })

  it('allows accessing other models', function () {
    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel, models } = feathersVuex(feathers, {
      idField: '_id',
      serverAlias
    })

    const servicePath = 'todos'
    class Todo extends BaseModel {
      public static modelName = 'Todo'
      public static servicePath = servicePath
    }
    const todosPlugin = makeServicePlugin({
      servicePath,
      Model: Todo,
      service: feathers.service(servicePath)
    })

    const store = new Vuex.Store({
      plugins: [todosPlugin]
    })

    assert(models[serverAlias][Todo.name] === Todo)
    assert(Todo.store === store)
  })

  it('allows service specific handleEvents', async function () {
    // feathers.use('todos', new TodosService())
    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
      idField: '_id',
      serverAlias
    })

    const servicePath = 'todos'
    class Todo extends BaseModel {
      public static modelName = 'Todo'
      public static servicePath = servicePath
    }

    let createdCalled = false
    let updatedCalled = false
    let patchedCalled = false
    let removedCalled = false
    const todosPlugin = makeServicePlugin({
      servicePath,
      Model: Todo,
      service: feathers.service(servicePath),
      handleEvents: {
        created() {
          createdCalled = true
          return true
        },
        updated() {
          updatedCalled = true
          return true
        },
        patched() {
          patchedCalled = true
          return true
        },
        removed() {
          removedCalled = true
          return true
        }
      }
    })

    const store = new Vuex.Store({
      plugins: [todosPlugin]
    })

    const todo = new Todo()

    // Fake server call
    feathers.service('todos').hooks({
      before: {
        create: [
          context => {
            delete context.data.__id
            delete context.data.__isTemp
          },
          context => {
            context.result = { _id: 24, ...context.data }
            return context
          }
        ],
        update: [
          context => {
            context.result = { ...context.data }
            return context
          }
        ],
        patch: [
          context => {
            context.result = { ...context.data }
            return context
          }
        ],
        remove: [
          context => {
            context.result = { ...todo }
            return context
          }
        ]
      }
    })

    await todo.create()
    assert(createdCalled, 'created handler called')

    await todo.update()
    assert(updatedCalled, 'updated handler called')

    await todo.patch()
    assert(patchedCalled, 'patched handler called')

    await todo.remove()
    assert(removedCalled, 'removed handler called')
  })

  it('fall back to globalOptions handleEvents if service specific handleEvents handler is missing', async function () {
    // feathers.use('todos', new TodosService())
    const serverAlias = 'default'

    let globalCreatedCalled = false
    let globalUpdatedCalled = false
    let globalPatchedCalled = false
    let globalRemovedCalled = false
    const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
      idField: '_id',
      serverAlias,
      handleEvents: {
        created() {
          globalCreatedCalled = true
          return true
        },
        updated() {
          globalUpdatedCalled = true
          return true
        },
        patched() {
          globalPatchedCalled = true
          return true
        },
        removed() {
          globalRemovedCalled = true
          return true
        }
      }
    })

    const servicePath = 'todos'
    class Todo extends BaseModel {
      public static modelName = 'Todo'
      public static servicePath = servicePath
    }

    let specificUpdatedCalled = false
    const todosPlugin = makeServicePlugin({
      servicePath,
      Model: Todo,
      service: feathers.service(servicePath),
      handleEvents: {
        updated() {
          specificUpdatedCalled = true
          return true
        }
      }
    })

    const store = new Vuex.Store({
      plugins: [todosPlugin]
    })

    const todo = new Todo()

    // Fake server call
    feathers.service('todos').hooks({
      before: {
        create: [
          context => {
            delete context.data.__id
            delete context.data.__isTemp
          },
          context => {
            context.result = { _id: 24, ...context.data }
            return context
          }
        ],
        update: [
          context => {
            context.result = { ...context.data }
            return context
          }
        ],
        patch: [
          context => {
            context.result = { ...context.data }
            return context
          }
        ],
        remove: [
          context => {
            context.result = { ...todo }
            return context
          }
        ]
      }
    })

    await todo.create()
    assert(globalCreatedCalled, 'global created handler called')

    await todo.update()
    assert(specificUpdatedCalled, 'specific updated handler called')
    assert(!globalUpdatedCalled, 'global updated handler NOT called')

    await todo.patch()
    assert(globalPatchedCalled, 'global patched handler called')

    await todo.remove()
    assert(globalRemovedCalled, 'global removed handler called')
  })

  it('allow handleEvents handlers to return extracted event data', async function () {
    const serverAlias = 'default'

    const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
      idField: '_id',
      serverAlias,
      handleEvents: {
        created(e) {
          return [true, e.myCreatedPropWithActualData]
        },
        updated(e) {
          return [true, e.myUpdatedPropWithActualData]
        },
        patched(e) {
          return [true, e.myPatchedPropWithActualData]
        },
        removed(e) {
          return [true, e.myRemovedPropWithActualData]
        }
      }
    })

    const servicePath = 'todos'
    class Todo extends BaseModel {
      public static modelName = 'Todo'
      public static servicePath = servicePath
    }

    const todosService = feathers.service(servicePath)
    const todosPlugin = makeServicePlugin({
      servicePath,
      Model: Todo,
      service: todosService
    })

    const store = new Vuex.Store<{ todos: ServiceState }>({
      plugins: [todosPlugin]
    })
    const { keyedById } = store.state.todos

    let createdData = null
    let updatedData = null
    let patchedData = null
    let removedData = null
    Todo.on('created', e => (createdData = e))
    Todo.on('updated', e => (updatedData = e))
    Todo.on('patched', e => (patchedData = e))
    Todo.on('removed', e => (removedData = e))

    assert(Object.keys(keyedById).length === 0, 'no todos in store')

    todosService.emit('created', {
      context: 'foo',
      myCreatedPropWithActualData: { _id: 42, text: '' }
    })
    assert(keyedById[42], 'todo added to store')
    assert(keyedById[42].text === '', 'todo string is empty')
    assert(createdData, "Model's created event fired")
    assert(
      createdData.context === 'foo' && createdData.myCreatedPropWithActualData,
      "Model's created event got all event data"
    )

    todosService.emit('updated', {
      context: 'bar',
      myUpdatedPropWithActualData: { _id: 42, text: 'updated' }
    })
    assert(keyedById[42].text === 'updated', 'todo was updated')
    assert(updatedData, "Model's updated event fired")
    assert(
      updatedData.context === 'bar' && updatedData.myUpdatedPropWithActualData,
      "Model's updated event got all event data"
    )

    todosService.emit('patched', {
      context: 'baz',
      myPatchedPropWithActualData: { _id: 42, text: 'patched' }
    })
    assert(keyedById[42].text === 'patched', 'todo was patched')
    assert(patchedData, "Model's patched event fired")
    assert(
      patchedData.context === 'baz' && patchedData.myPatchedPropWithActualData,
      "Model's patched event got all event data"
    )

    todosService.emit('removed', {
      context: 'spam',
      myRemovedPropWithActualData: { _id: 42 }
    })
    assert(Object.keys(keyedById).length === 0, 'todo removed from store')
    assert(removedData, "Model's removed event fired")
    assert(
      removedData.context === 'spam' && removedData.myRemovedPropWithActualData,
      "Model's removed event got all event data"
    )
  })
})
