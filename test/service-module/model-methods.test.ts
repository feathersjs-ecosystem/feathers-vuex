/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { ServiceState } from './types'
import { assert } from 'chai'
import feathersVuex from '../../src/index'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex from 'vuex'
import { clearModels } from '../../src/service-module/global-models'

require('events').EventEmitter.prototype._maxListeners = 100

interface TodoState extends ServiceState {
  test: any
  test2: {
    test: boolean
  }
  isTrue: boolean
}
interface RootState {
  todos: TodoState
  tasks: ServiceState
  tests: ServiceState
  blah: ServiceState
  things: ServiceState
}

function makeContext() {
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'model-methods'
  })
  class Task extends BaseModel {
    public static modelName = 'Task'
    public static servicePath: 'tasks'
    public constructor(data?, options?) {
      super(data, options)
    }
  }
  class Todo extends BaseModel {
    public static modelName = 'Todo'
    public static servicePath: 'todos'
    public constructor(data?, options?) {
      super(data, options)
    }
  }
  const store = new Vuex.Store<RootState>({
    strict: true,
    plugins: [
      makeServicePlugin({
        Model: Task,
        service: feathersClient.service('tasks'),
        preferUpdate: true
      }),
      makeServicePlugin({
        Model: Todo,
        service: feathersClient.service('todos')
      })
    ]
  })
  return {
    BaseModel,
    Task,
    Todo,
    store
  }
}

describe('Models - Methods', function () {
  beforeEach(() => {
    clearModels()
  })

  it('Model.find', function () {
    const { Task } = makeContext()

    assert(typeof Task.find === 'function')
  })

  it('Model.findInStore', function () {
    const { Task } = makeContext()

    assert(typeof Task.findInStore === 'function')
  })

  it('Model.get', function () {
    const { Task } = makeContext()

    assert(typeof Task.get === 'function')
  })

  it('Model.getFromStore', function () {
    const { Task } = makeContext()

    assert(typeof Task.getFromStore === 'function')
  })

  it('instance.save calls create with correct arguments', function () {
    const { Task } = makeContext()
    const module = new Task({ test: true })

    Object.defineProperty(module, 'create', {
      value(params) {
        assert(arguments.length === 1, 'should have only called with params')
        assert(
          params === undefined,
          'no params should have been passed this time'
        )
      }
    })

    module.save()
  })

  it('instance.save passes params to create', function () {
    const { Task } = makeContext()
    const task = new Task({ test: true })
    let called = false

    Object.defineProperty(task, 'create', {
      value(params) {
        assert(arguments.length === 1, 'should have only called with params')
        assert(params.test, 'should have received params')
        called = true
      }
    })

    task.save({ test: true })
    assert(called, 'create should have been called')
  })

  it('instance.save passes params to patch', function () {
    const { Todo } = makeContext()
    const todo = new Todo({ id: 1, test: true })
    let called = false

    Object.defineProperty(todo, 'patch', {
      value(params) {
        assert(arguments.length === 1, 'should have only called with params')
        assert(params.test, 'should have received params')
        called = true
      }
    })

    todo.save({ test: true })
    assert(called, 'patch should have been called')
  })

  it('instance.save passes params to update', function () {
    const { Task } = makeContext()
    Task.preferUpdate = true

    const task = new Task({ id: 1, test: true })
    let called = false

    Object.defineProperty(task, 'update', {
      value(params) {
        assert(arguments.length === 1, 'should have only called with params')
        assert(params.test, 'should have received params')
        called = true
      }
    })

    task.save({ test: true })
    assert(called, 'update should have been called')
  })

  it('instance.remove works with temp records', function () {
    const { Task, store } = makeContext()
    const task = new Task({ test: true })
    const tempId = task.__id

    task.remove()

    // @ts-ignore
    assert(!store.state.tasks.tempsById[tempId], 'temp was removed')
  })

  it('instance.toJSON', function () {
    const { Task } = makeContext()
    const task = new Task({ id: 1, test: true })

    Object.defineProperty(task, 'getter', {
      get() {
        return `got'er`
      }
    })

    assert.equal(task.getter, `got'er`)

    const json = task.toJSON()

    assert(json, 'got json')
  })
})
