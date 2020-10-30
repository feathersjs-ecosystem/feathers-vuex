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
  ['model-methods-persons']: ServiceState
  ['model-methods-todos']: TodoState
  ['model-methods-tasks']: ServiceState
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

  feathersClient.use('model-methods-letters', memory())

  const lettersService = feathersClient.service('model-methods-letters')

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
    public static servicePath: 'model-methods-tasks'
    public constructor(data?, options?) {
      super(data, options)
    }
  }
  class Todo extends BaseModel {
    public static modelName = 'Todo'
    public static servicePath: 'model-methods-todos'
    public constructor(data?, options?) {
      super(data, options)
    }
  }

  class Letter extends BaseModel {
    public constructor(data?, options?) {
      super(data, options)
    }
    public static modelName = 'Letter'
    public static servicePath = 'model-methods-letters'
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

  class Person extends BaseModel {
    public static modelName = 'Person'
    public static servicePath = 'model-methods-persons'
    public constructor(data?, options?) {
      super(data, options)
    }
  }

  const store = new Vuex.Store<RootState>({
    strict: true,
    plugins: [
      makeServicePlugin({
        Model: Task,
        servicePath: 'model-methods-tasks',
        service: feathersClient.service('model-methods-tasks'),
        preferUpdate: true,
        namespace: 'model-methods-tasks'
      }),
      makeServicePlugin({
        Model: Todo,
        servicePath: 'model-methods-todos',
        service: feathersClient.service('model-methods-todos'),
        namespace: 'model-methods-todos'
      }),
      makeServicePlugin({
        Model: Letter,
        servicePath: 'model-methods-letters',
        service: feathersClient.service('model-methods-letters'),
        namespace: 'model-methods-letters'
      }),
      makeServicePlugin({
        Model: Person,
        servicePath: 'model-methods-persons',
        service: feathersClient.service('model-methods-persons'),
        keepCopiesInStore: true,
        namespace: 'model-methods-persons'
      })
    ]
  })

  // Fake server call
  feathersClient.service('model-methods-tasks').hooks({
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
          context.result = {}
          return context
        }
      ]
    }
  })

  // Fake server call
  feathersClient.service('model-methods-persons').hooks({
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
          context.result = {}
          return context
        }
      ]
    }
  })

  return {
    BaseModel,
    Task,
    Todo,
    Letter,
    Person,
    lettersService,
    store
  }
}

export { makeContext }

describe('Models - Methods', function () {
  beforeEach(() => {
    clearModels()
  })

  it('Model.find is a function', function () {
    const { Task } = makeContext()

    assert(typeof Task.find === 'function')
  })

  it('Model.find returns a Promise', function () {
    const { Task } = makeContext()
    const result = Task.find()
    assert(typeof result.then !== 'undefined')
    result.catch(err => {
      /* noop -- prevents UnhandledPromiseRejectionWarning */
    })
  })

  it('Model.findInStore', function () {
    const { Task } = makeContext()

    assert(typeof Task.findInStore === 'function')
  })

  it('Model.count is a function', function () {
    const { Task } = makeContext()

    assert(typeof Task.count === 'function')
  })

  it('Model.count returns a Promise', function () {
    const { Task } = makeContext()
    const result = Task.count({ query: {} })
    assert(typeof result.then !== 'undefined')
    result.catch(err => {
      /* noop -- prevents UnhandledPromiseRejectionWarning */
    })
  })

  it('Model.countInStore', function () {
    const { Task } = makeContext()

    assert(typeof Task.countInStore === 'function')
  })

  it('Model.get', function () {
    const { Task } = makeContext()

    assert(typeof Task.get === 'function')
  })

  it('Model.getFromStore', function () {
    const { Task } = makeContext()

    assert(typeof Task.getFromStore === 'function')
  })

  it('allows listening to Feathers events on Model', function (done) {
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

  it('instance.save calls create with correct arguments', function () {
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

    assert(
      !store.state['model-methods-tasks'].tempsById[tempId],
      'temp was removed'
    )
  })

  it('instance.remove removes cloned record from the store', async function () {
    const { Person, store } = makeContext()
    const person = new Person({ _id: 1, test: true })
    const id = person._id

    // @ts-ignore
    const { copiesById } = store.state['model-methods-persons']

    person.clone()

    assert(copiesById[id], 'clone exists')

    await person.remove()

    assert(!copiesById[id], 'clone was removed')
  })

  it('instance.remove removes cloned record from Model.copiesById', async function () {
    const { Task } = makeContext()
    const task = new Task({ _id: 2, test: true })
    const id = task._id

    task.clone()

    assert(Task.copiesById[id], 'clone exists')

    await task.remove()

    assert(!Task.copiesById[id], 'clone was removed')
  })

  it('instance.remove for temp record removes cloned record from the store', function () {
    const { Person, store } = makeContext()
    const person = new Person({ test: true })
    const tempId = person.__id

    // @ts-ignore
    const { copiesById } = store.state['model-methods-persons']

    person.clone()

    assert(copiesById[tempId], 'clone exists')

    person.remove()

    assert(!copiesById[tempId], 'clone was removed')
  })

  it('instance.remove for temp record removes cloned record from the Model.copiesById', function () {
    const { Task } = makeContext()
    const task = new Task({ test: true })
    const tempId = task.__id

    task.clone()

    assert(Task.copiesById[tempId], 'clone exists')

    task.remove()

    assert(!Task.copiesById[tempId], 'clone was removed')
  })

  it('removes clone and original upon calling clone.remove()', async function () {
    const { Person, store } = makeContext()
    const person = new Person({ _id: 1, test: true })
    const id = person._id

    // @ts-ignore
    const { copiesById, keyedById } = store.state['model-methods-persons']

    person.clone()

    assert(copiesById[id], 'clone exists')
    assert(keyedById[id], 'original exists')

    const clone = copiesById[id]

    await clone.remove()

    assert(!copiesById[id], 'clone was removed')
    assert(!keyedById[id], 'original was removed')
  })

  it('instance methods still available in store data after updateItem mutation (or socket event)', async function () {
    const { Letter, store, lettersService } = makeContext()
    let letter = new Letter({ name: 'Garmadon', age: 1025 })

    letter = await letter.save()

    assert.equal(
      typeof letter.save,
      'function',
      'saved instance has a save method'
    )

    store.commit('model-methods-letters/updateItem', {
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

  it('Dates remain as dates after changes', async function () {
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

  it('Model pending status sets/clears for create/update/patch/remove', async function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'model-methods'
    })
    class PendingThing extends BaseModel {
      public static modelName = 'PendingThing'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: PendingThing,
          service: feathersClient.service('methods-pending-things')
        })
      ]
    })

    // Create instance
    const thing = new PendingThing({ description: 'pending test' })
    const clone = thing.clone()
    assert(!!thing.__id, "thing has a tempId")
    assert(clone.__id === thing.__id, "clone has thing's tempId")

    // Manually set the result in a hook to simulate the server request.
    feathersClient.service('methods-pending-things').hooks({
      before: {
        create: [
          context => {
            context.result = { _id: 42, ...context.data }
            // Check pending status
            assert(thing.isCreatePending === true, 'isCreatePending set')
            assert(thing.isSavePending === true, 'isSavePending set')
            assert(thing.isPending === true, 'isPending set')
            // Check clone's pending status
            assert(clone.isCreatePending === true, 'isCreatePending set on clone')
            assert(clone.isSavePending === true, 'isSavePending set on clone')
            assert(clone.isPending === true, 'isPending set on clone')
            return context
          }
        ],
        update: [
          context => {
            context.result = { ...context.data }
            // Check pending status
            assert(thing.isUpdatePending === true, 'isUpdatePending set')
            assert(thing.isSavePending === true, 'isSavePending set')
            assert(thing.isPending === true, 'isPending set')
            // Check clone's pending status
            assert(clone.isUpdatePending === true, 'isUpdatePending set on clone')
            assert(clone.isSavePending === true, 'isSavePending set on clone')
            assert(clone.isPending === true, 'isPending set on clone')
            return context
          }
        ],
        patch: [
          context => {
            context.result = { ...context.data }
            // Check pending status
            assert(thing.isPatchPending === true, 'isPatchPending set')
            assert(thing.isSavePending === true, 'isSavePending set')
            assert(thing.isPending === true, 'isPending set')
            // Check clone's pending status
            assert(clone.isPatchPending === true, 'isPatchPending set on clone')
            assert(clone.isSavePending === true, 'isSavePending set on clone')
            assert(clone.isPending === true, 'isPending set on clone')
            return context
          }
        ],
        remove: [
          context => {
            context.result = { ...context.data }
            // Check pending status
            assert(thing.isRemovePending === true, 'isRemovePending set')
            assert(thing.isSavePending === false, 'isSavePending clear on remove')
            assert(thing.isPending === true, 'isPending set')
            // Check clone's pending status
            assert(clone.isRemovePending === true, 'isRemovePending set on clone')
            assert(clone.isSavePending === false, 'isSavePending clear on remove on clone')
            assert(clone.isPending === true, 'isPending set on clone')
            return context
          }
        ]
      }
    })

    // Create and verify status
    await thing.create()
    assert(thing.isCreatePending === false, 'isCreatePending cleared')
    assert(thing.isSavePending === false, 'isSavePending cleared')
    assert(thing.isPending === false, 'isPending cleared')
    assert(clone.isCreatePending === false, 'isCreatePending cleared on clone')
    assert(clone.isSavePending === false, 'isSavePending cleared on clone')
    assert(clone.isPending === false, 'isPending cleared on clone')

    // Update and verify status
    await thing.update()
    assert(thing.isUpdatePending === false, 'isUpdatePending cleared')
    assert(thing.isSavePending === false, 'isSavePending cleared')
    assert(thing.isPending === false, 'isPending cleared')
    assert(clone.isUpdatePending === false, 'isUpdatePending cleared on clone')
    assert(clone.isSavePending === false, 'isSavePending cleared on clone')
    assert(clone.isPending === false, 'isPending cleared on clone')

    // Patch and verify status
    await thing.patch()
    assert(thing.isPatchPending === false, 'isPatchPending cleared')
    assert(thing.isSavePending === false, 'isSavePending cleared')
    assert(thing.isPending === false, 'isPending cleared')
    assert(clone.isPatchPending === false, 'isPatchPending cleared on clone')
    assert(clone.isSavePending === false, 'isSavePending cleared on clone')
    assert(clone.isPending === false, 'isPending cleared on clone')

    // Remove and verify status
    await thing.remove()
    assert(thing.isRemovePending === false, 'isRemovePending cleared')
    assert(thing.isSavePending === false, 'isSavePending cleared')
    assert(thing.isPending === false, 'isPending cleared')
    assert(clone.isRemovePending === false, 'isRemovePending cleared on clone')
    assert(clone.isSavePending === false, 'isSavePending cleared on clone')
    assert(clone.isPending === false, 'isPending cleared on clone')
  })
})
