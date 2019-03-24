/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import { feathersRestClient as feathers } from '../../../test/fixtures/feathers-client'
import feathersVuex from './index'

Vue.use(Vuex)

describe.only('makeModel', function() {
  it('propertly sets up the BaseModel', function() {
    const serverAlias = 'default'
    const { BaseModel } = feathersVuex(feathers, {
      serverAlias
    })

    assert(BaseModel.name === 'FeathersVuexModel', 'name in place')
    assert(
      BaseModel.serverAlias === 'default',
      'serverAlias in place on BaseModel'
    )
    assert(!BaseModel.store, 'no store by default')
    assert(BaseModel.models, 'models are available')
    assert(BaseModel.idField === 'id', 'default idField is id')
    assert(typeof BaseModel.getId === 'function', 'have the getId method')
  })

  // it('default values', function() {
  //   const serverAlias = 'default'
  //   const { BaseModel } = feathersVuex(feathers, {
  //     serverAlias
  //   })
  // })
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
    public static store: Record<string, any>
    public constructor(data) {
      super(data)
    }
  }

  // TODO: move this into makeServicePlugin
  addModel(Todo)

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
