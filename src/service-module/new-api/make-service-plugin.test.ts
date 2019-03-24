/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import Vue from 'vue'
import Vuex, { StoreOptions } from 'vuex'
import { feathersRestClient as feathers } from '../../../test/fixtures/feathers-client'
import feathersVuex from './index'
import _pick from 'lodash.pick'

Vue.use(Vuex)

describe('makeServicePlugin', function() {
  it('regisers the vuex module with options', function() {
    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
      serverAlias
    })

    const servicePath = 'todos'
    class Todo extends BaseModel {
      public servicePath = servicePath
    }
    const todosPlugin = makeServicePlugin({
      Model: Todo,
      service: feathers.service(servicePath)
    })
    interface RootState {
      todos: { options: {} }
    }
    const store = new Vuex.Store<RootState>({ plugins: [todosPlugin] })

    const keys = Object.keys(store.state.todos.options)
    const received = _pick(store.state.todos.options, keys)
    const expected = {
      addOnUpsert: false,
      autoRemove: false,
      debug: false,
      diffOnPatch: true,
      enableEvents: true,
      idField: 'id',
      keepCopiesInStore: false,
      modelName: 'Todo',
      nameStyle: 'short',
      namespace: 'todos',
      paramsForServer: [],
      preferUpdate: false,
      replaceItems: false,
      serverAlias: 'default',
      servicePath: 'todos',
      skipRequestIfExists: false,
      whitelist: []
    }

    assert.deepEqual(received, expected, 'The module was registered.')
  })

  it('sets up Model.store && service.FeathersVuexModel', function() {
    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
      serverAlias
    })

    const servicePath = 'todos'
    const service = feathers.service(servicePath)
    class Todo extends BaseModel {
      public servicePath = servicePath
    }
    const todosPlugin = makeServicePlugin({ Model: Todo, service })
    const store = new Vuex.Store({ plugins: [todosPlugin] })

    assert(Todo.store === store, 'the store is on the Model!')
    assert.equal(service.FeathersVuexModel, Todo, 'Model accessible on service')
  })

  it('allows accessing other models', function() {
    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel, addModel, models } = feathersVuex(
      feathers,
      { idField: '_id', serverAlias }
    )

    const servicePath = 'todos'
    class Todo extends BaseModel {
      public servicePath = servicePath
    }
    addModel(Todo)
    const todosPlugin = makeServicePlugin({
      Model: Todo,
      service: feathers.service(servicePath)
    })

    const store = new Vuex.Store({
      plugins: [todosPlugin]
    })

    assert(models[serverAlias][Todo.name] === Todo)
    assert(Todo.store === store)
  })
})
