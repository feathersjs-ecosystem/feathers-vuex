/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import { clearModels } from '../../src/service-module/global-models'
import { clients } from '../../src/service-module/global-clients'
import { feathersRestClient as feathers } from '../../test/fixtures/feathers-client'
import feathersVuex from '../../src/index'
import _pick from 'lodash/pick'
import _omit from 'lodash/omit'

Vue.use(Vuex)

describe('makeServicePlugin', function() {
  beforeEach(() => {
    clearModels()
  })

  it('adds Feathers client to the global clients', () => {
    feathersVuex(feathers, {
      serverAlias: 'this is a test'
    })
    assert(clients.byAlias['this is a test'], 'got a reference to the client.')
  })

  it('registers the vuex module with options', function() {
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
      keyedById: {},
      modelName: 'Todo',
      nameStyle: 'short',
      namespace: 'todos',
      pagination: {
        defaultLimit: null,
        defaultSkip: null
      },
      paramsForServer: [],
      preferUpdate: false,
      replaceItems: false,
      serverAlias: 'default',
      servicePath: 'todos',
      skipRequestIfExists: false,
      tempsById: {},
      whitelist: []
    }

    assert.deepEqual(_omit(received), _omit(expected), 'defaults in place.')
  })

  it('sets up Model.store && service.FeathersVuexModel', function() {
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

  it('allows accessing other models', function() {
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

  it('allows service specific handleEvents', async function() {
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

  it('fall back to globalOptions handleEvents if service specific handleEvents handler is missing', async function() {
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
})
