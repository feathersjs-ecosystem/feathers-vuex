import { assert } from 'chai'
import Vuex from 'vuex'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import feathersVuex from '../../src/index'

interface RootState {
  todos: any
}

function makeContext() {
  const todoService = feathersClient.service('todos')
  const serverAlias = 'reinitialization'
  const { makeServicePlugin, BaseModel, models } = feathersVuex(
    feathersClient,
    {
      serverAlias
    }
  )
  class Todo extends BaseModel {
    public static modelName = 'Todo'
  }
  return {
    makeServicePlugin,
    BaseModel,
    todoService,
    Todo,
    models,
    serverAlias
  }
}

describe('Service Module - Reinitialization', function () {
  /**
   * Tests that when the make service plugin is reinitialized state
   * is reset in the vuex module/model.
   * This prevents state pollution in SSR setups.
   */
  it('does not preserve module/model state when reinitialized', function () {
    const {
      makeServicePlugin,
      todoService,
      Todo,
      models,
      serverAlias
    } = makeContext()
    const todosPlugin = makeServicePlugin({
      servicePath: 'todos',
      Model: Todo,
      service: todoService
    })
    let store = new Vuex.Store<RootState>({
      plugins: [todosPlugin]
    })
    let todoState = store.state['todos']
    const virginState = {
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
      serverAlias,
      servicePath: 'todos',
      skipRequestIfExists: false,
      tempsById: {},
      whitelist: []
    }

    assert.deepEqual(
      todoState,
      virginState,
      'vuex module state is correct on first initialization'
    )
    assert.deepEqual(
      models[serverAlias][Todo.name].store.state[Todo.namespace],
      todoState,
      'model state is the same as vuex module state on first initialization'
    )

    // Simulate some mutations on the store.
    const todo = {
      id: 1,
      testProp: true
    }

    store.commit('todos/addItem', todo)
    const serviceTodo = store.state['todos'].keyedById[1]

    assert.equal(
      todo.testProp,
      serviceTodo.testProp,
      'todo is added to the store'
    )

    assert.deepEqual(
      models[serverAlias][Todo.name].store.state[Todo.namespace],
      todoState,
      'model state is the same as vuex module state when store is mutated'
    )

    // Here we are going to simulate the make service plugin being reinitialized.
    // This is the default behaviour in SSR setups, e.g. nuxt universal mode,
    // although unlikely in SPAs.
    store = new Vuex.Store<RootState>({
      plugins: [todosPlugin]
    })

    todoState = store.state['todos']

    // We expect vuex module state for this service to be reset.
    assert.deepEqual(
      todoState,
      virginState,
      'store state in vuex module is not preserved on reinitialization'
    )
    // We also expect model store state for this service to be reset.
    assert.deepEqual(
      models[serverAlias][Todo.name].store.state[Todo.namespace],
      virginState,
      'store state in service model is not preserved on reinitialization'
    )
  })
})
