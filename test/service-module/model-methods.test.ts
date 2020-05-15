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
import memory from 'feathers-memory'
import { makeStore } from '../test-utils'
import { isDate } from 'date-fns'

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

  const serialize = context => {
    context.data = JSON.parse(JSON.stringify(context.data))
  }
  const deserialize = context => {
    context.result = JSON.parse(JSON.stringify(context.result))
  }

  feathersClient.use('letters', memory())

  const lettersService = feathersClient.service('letters')

  // Setup hooks on letters service to simulate toJSON serialization that occurs
  // with a remote API request.
  lettersService.hooks({
    before: {
      create: [serialize],
      update: [serialize],
      patch: [serialize]
    },
    after: {
      create: [deserialize],
      patch: [deserialize],
      update: [deserialize]
    }
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

  class Letter extends BaseModel {
    public constructor(data?, options?) {
      super(data, options)
    }
    public static modelName = 'Letter'
    public static instanceDefaults(data, { models, store }) {
      return {
        to: '',
        from: ''
      }
    }
    public static setupInstance(data, { models }) {
      if (typeof data.createdAt === 'string') {
        data.createdAt = new Date(data.createdAt) // just assuming the date is formatted correctly ;)
      }
      return data
    }
    public get status() {
      return 'pending'
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
      }),
      makeServicePlugin({
        Model: Letter,
        servicePath: 'letters',
        service: feathersClient.service('letters')
      })
    ]
  })
  return {
    BaseModel,
    Task,
    Todo,
    Letter,
    lettersService,
    store
  }
}

export { makeContext }

describe('Models - Methods', function() {
  beforeEach(() => {
    clearModels()
  })

  it('Model.find is a function', function() {
    const { Task } = makeContext()

    assert(typeof Task.find === 'function')
  })

  it('Model.find returns a Promise', function() {
    const { Task } = makeContext()
    const result = Task.find()
    assert(typeof result.then !== 'undefined')
    result.catch(err => {
      /* noop -- prevents UnhandledPromiseRejectionWarning */
    })
  })

  it('Model.findInStore', function() {
    const { Task } = makeContext()

    assert(typeof Task.findInStore === 'function')
  })

  it('Model.get', function() {
    const { Task } = makeContext()

    assert(typeof Task.get === 'function')
  })

  it('Model.getFromStore', function() {
    const { Task } = makeContext()

    assert(typeof Task.getFromStore === 'function')
  })

  it('allows listening to Feathers events on Model', function(done) {
    const { Letter } = makeContext()

    Letter.on('created', data => {
      assert(data.to === 'Santa', 'received event with data')
      done()
    })

    // This should trigger an event from the bottom of make-service-plugin.ts
    const letter = new Letter({
      from: 'Me',
      to: 'Santa'
    }).save()
  })

  it('instance.save calls create with correct arguments', function() {
    const { Task } = makeContext()
    const task = new Task({ test: true })

    Object.defineProperty(task, 'create', {
      value(params) {
        assert(arguments.length === 1, 'should have only called with params')
        assert(
          params === undefined,
          'no params should have been passed this time'
        )
      }
    })

    task.save()
  })

  it('instance.save passes params to create', function() {
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

  it('instance.save passes params to patch', function() {
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

  it('instance.save passes params to update', function() {
    const { Task } = makeContext()
    //@ts-ignore
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

  it('instance.remove works with temp records', function() {
    const { Task, store } = makeContext()
    const task = new Task({ test: true })
    const tempId = task.__id

    task.remove()

    // @ts-ignore
    assert(!store.state.tasks.tempsById[tempId], 'temp was removed')
  })

  it.skip('instance.remove removes cloned records from the store', function() {})
  it.skip('instance.remove removes cloned records from the Model.copiesById', function() {})
  it.skip('removes clone and original upon calling clone.remove()', function() {})

  it('instance methods still available in store data after updateItem mutation (or socket event)', async function() {
    const { Letter, store, lettersService } = makeContext()
    let letter = new Letter({ name: 'Garmadon', age: 1025 })

    letter = await letter.save()

    assert.equal(
      typeof letter.save,
      'function',
      'saved instance has a save method'
    )

    store.commit('letters/updateItem', {
      id: letter.id,
      name: 'Garmadon / Dad',
      age: 1026
    })

    const letter2 = new Letter({
      id: letter.id,
      name: 'Just Garmadon',
      age: 1027
    })

    assert.equal(
      typeof letter2.save,
      'function',
      'new instance has a save method'
    )
  })

  it('Dates remain as dates after changes', async function() {
    const { Letter, store, lettersService } = makeContext()
    let letter = new Letter({
      name: 'Garmadon',
      age: 1025,
      createdAt: new Date().toString()
    })

    assert(isDate(letter.createdAt), 'createdAt should be a date')

    letter = await letter.save()
    assert(isDate(letter.createdAt), 'createdAt should be a date')

    letter = await letter.save()
    assert(isDate(letter.createdAt), 'createdAt should be a date')
  })

  it('instance.toJSON', function() {
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
