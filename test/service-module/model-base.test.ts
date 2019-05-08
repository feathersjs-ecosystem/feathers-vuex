/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import Vue from 'vue'
import Vuex from 'vuex'
import { clearModels } from '../../src/service-module/global-models'
import {
  feathersRestClient as feathers,
  makeFeathersRestClient
} from '../fixtures/feathers-client'
import feathersVuex from '../../src/index'

Vue.use(Vuex)

process.setMaxListeners(100)

describe.skip('Model - Standalone', function () {
  it.skip('allows using a model without a service', function () { })
  it.skip('rename serverAlias to just `alias` or maybe `groupName`', function () { })
})

describe('makeModel / BaseModel', function () {
  before(() => {
    clearModels()
  })

  it('properly sets up the BaseModel', function () {
    const alias = 'default'
    const { BaseModel } = feathersVuex(feathers, { serverAlias: alias })
    const {
      name,
      store,
      namespace,
      idField,
      preferUpdate,
      serverAlias,
      models,
      copiesById
    } = BaseModel

    assert(name === 'BaseModel', 'name in place')

    // Monkey patched onto the Model class in `makeServicePlugin()`
    assert(!store, 'no store by default')
    assert(!namespace, 'no namespace by default')

    assert(idField === 'id', 'default idField is id')
    assert(!preferUpdate, 'prefer fetch by default')

    // Readonly props
    assert(serverAlias === 'default', 'serverAlias')
    assert(models, 'models are available')
    assert.equal(Object.keys(copiesById).length, 0, 'copiesById is empty')

    // Static Methods
    const staticMethods = [
      'getId',
      'find',
      'findInStore',
      'get',
      'getFromStore'
    ]
    staticMethods.forEach(method => {
      assert(typeof BaseModel[method] === 'function', `has ${method} method`)
    })

    // Prototype Methods
    const prototypeMethods = [
      'clone',
      'reset',
      'commit',
      'save',
      'create',
      'patch',
      'update',
      'remove'
    ]
    prototypeMethods.forEach(method => {
      assert(
        typeof BaseModel.prototype[method] === 'function',
        `has ${method} method`
      )
    })
  })

  it('allows customization through the FeathersVuexOptions', function () {
    const { BaseModel } = feathersVuex(feathers, {
      serverAlias: 'myApi',
      idField: '_id',
      preferUpdate: true
    })
    const { idField, preferUpdate, serverAlias } = BaseModel

    assert(idField === '_id', 'idField was set')
    assert(preferUpdate, 'turned on preferUpdate')
    assert(serverAlias === 'myApi', 'serverAlias was set')
  })

  it('receives store & other props after Vuex plugin is registered', function () {
    const { BaseModel, makeServicePlugin } = feathersVuex(feathers, {
      serverAlias: 'myApi'
    })
    const plugin = makeServicePlugin({
      servicePath: 'todos',
      service: feathers.service('todos'),
      Model: BaseModel
    })
    new Vuex.Store({
      plugins: [plugin]
    })
    const { store, namespace, servicePath } = BaseModel

    assert(store, 'store is in place')
    assert.equal(namespace, 'todos', 'namespace is in place')
    assert.equal(servicePath, 'todos', 'servicePath is in place')
  })

  it('allows access to other models after Vuex plugins are registered', function () {
    const serverAlias = 'default'
    const { makeServicePlugin, BaseModel, models } = feathersVuex(feathers, {
      idField: '_id',
      serverAlias
    })

    // Create a Todo Model & Plugin
    class Todo extends BaseModel {
      public static modelName = 'Todo'
      public test: boolean = true
    }
    const todosPlugin = makeServicePlugin({
      servicePath: 'todos',
      Model: Todo,
      service: feathers.service('todos')
    })

    // Create a Task Model & Plugin
    class Task extends BaseModel {
      public static modelName = 'Task'
      public test: boolean = true
    }
    const tasksPlugin = makeServicePlugin({
      servicePath: 'tasks',
      Model: Task,
      service: feathers.service('tasks')
    })

    // Register the plugins
    new Vuex.Store({
      plugins: [todosPlugin, tasksPlugin]
    })

    assert(models[serverAlias][Todo.name] === Todo)
    assert.equal(Todo.models, models, 'models available at Model.models')
    assert.equal(Task.models, models, 'models available at Model.models')
  })

  it('works with multiple, independent Feathers servers', function () {
    // Create a Todo Model & Plugin on myApi
    const feathersMyApi = makeFeathersRestClient('https://api.my-api.com')
    const myApi = feathersVuex(feathersMyApi, {
      idField: '_id',
      serverAlias: 'myApi'
    })
    class Todo extends myApi.BaseModel {
      public static modelName = 'Todo'
      public test: boolean = true
    }
    const todosPlugin = myApi.makeServicePlugin({
      Model: Todo,
      service: feathersMyApi.service('todos')
    })

    // Create a Task Model & Plugin on theirApi
    const feathersTheirApi = makeFeathersRestClient('https://api.their-api.com')
    const theirApi = feathersVuex(feathersTheirApi, {
      serverAlias: 'theirApi'
    })
    class Task extends theirApi.BaseModel {
      public static modelName = 'Task'
      public test: boolean = true
    }
    const tasksPlugin = theirApi.makeServicePlugin({
      Model: Task,
      service: feathersTheirApi.service('tasks')
    })

    // Register the plugins
    new Vuex.Store({
      plugins: [todosPlugin, tasksPlugin]
    })
    const { models } = myApi

    assert(models.myApi.Todo === Todo)
    assert(!models.theirApi.Todo, `Todo stayed out of the 'theirApi' namespace`)
    assert(models.theirApi.Task === Task)
    assert(!models.myApi.Task, `Task stayed out of the 'myApi' namespace`)

    assert.equal(
      models.myApi.byServicePath[Todo.servicePath],
      Todo,
      'also registered in models.byServicePath'
    )
    assert.equal(
      models.theirApi.byServicePath[Task.servicePath],
      Task,
      'also registered in models.byServicePath'
    )
  })
})
