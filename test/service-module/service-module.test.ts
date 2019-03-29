/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { ServiceState } from './types'
import { assert } from 'chai/chai'
import feathersVuex, { models } from '../../src/index'
import { clearModels } from '../../src/service-module/global-models'

import {
  makeFeathersRestClient,
  feathersRestClient as feathersClient,
  feathersSocketioClient
} from '../fixtures/feathers-client'
import { stripSlashes } from '../../src/utils'
import memory from 'feathers-memory'
import { makeTodos } from '../fixtures/todos'
import Vuex from 'vuex'

interface Options {
  idField: string
}
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
    serverAlias: 'service-module'
  })

  class ServiceTodo extends BaseModel {
    public id
    public description: string

    public constructor(data, options?) {
      super(data, options)
    }
  }
  class HotspotMedia extends BaseModel {
    public id
    public description: string
  }
  class Media extends BaseModel {
    public id
    public description: string
  }
  class Person extends BaseModel {
    public static test: boolean = true
  }
  class Item extends BaseModel {
    public static test: boolean = true
  }
  class Task extends BaseModel {
    public static test: boolean = true
  }
  class Car extends BaseModel {
    public static test: boolean = true
  }
  class Group extends BaseModel {
    public static test: boolean = true
  }
  class Test extends BaseModel {
    public static test: boolean = true
  }
  class Thing extends BaseModel {
    public static test: boolean = true
  }

  return {
    makeServicePlugin,
    BaseModel,
    ServiceTodo,
    HotspotMedia,
    Media,
    Person,
    Item,
    Task,
    Car,
    Group,
    Test,
    Thing
  }
}

describe('Service Module', function() {
  beforeEach(() => {
    clearModels()
  })

  it('registers a vuex plugin and Model for the service', function() {
    const { makeServicePlugin, ServiceTodo, BaseModel } = makeContext()
    const serviceName = 'service-todos'
    const feathersService = feathersClient.service(serviceName)
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: ServiceTodo,
          service: feathersClient.service(serviceName)
        })
      ]
    })
    assert(
      models['service-module'].hasOwnProperty('ServiceTodo'),
      'the Model was added to the models'
    )
    assert(
      feathersService.FeathersVuexModel === ServiceTodo,
      'the Model is also found at service.FeathersVuexModel'
    )

    const serviceTodo = new ServiceTodo({
      description: 'Do the dishes',
      isComplete: false
    })
    assert(serviceTodo instanceof ServiceTodo, 'Model can be instantiated.')
    assert(serviceTodo instanceof BaseModel, 'Model can be instantiated.')

    assert(store.state[serviceName])
  })

  describe('Models', function() {
    beforeEach(function() {
      const { makeServicePlugin, ServiceTodo } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: ServiceTodo,
            service: feathersClient.service('service-todos')
          })
        ]
      })
      assert(store)
      assert(
        models['service-module'].hasOwnProperty('ServiceTodo'),
        'the Model was added to the models'
      )
      const owners = (this.owners = [
        { id: 1, name: 'Marshall' },
        { id: 2, name: 'Mariah' },
        { id: 3, name: 'Leah' }
      ])
      const data = {
        id: 1,
        description: 'Do the dishes',
        isComplete: false,
        owners
      }
      store.commit('service-todos/addItem', data)

      const serviceTodo = store.state['service-todos'].keyedById[1]

      this.serviceTodo = serviceTodo
      this.ServiceTodo = ServiceTodo
    })

    it('allows creating model clones', function() {
      const { ServiceTodo } = this
      const serviceTodoClone = this.serviceTodo.clone()

      assert(
        serviceTodoClone.isClone,
        'created a todo clone with isClone attribute'
      )
      assert(
        serviceTodoClone instanceof ServiceTodo,
        'the copy is an instance of the same class'
      )
    })

    it('allows modifying clones without affecting the original', function() {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()

      serviceTodoClone.description = 'Do something else'

      assert(
        serviceTodo.description === 'Do the dishes',
        'the original todo remained intact'
      )
    })

    it('allows commiting changes back to the original in the store', function() {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()

      serviceTodoClone.description = 'Do something else'
      serviceTodoClone.commit()

      assert(
        serviceTodo.description === 'Do something else',
        'the original todo was updated'
      )
    })

    it('performs a shallow merge when commiting back to the original record', function() {
      const { serviceTodo, owners } = this
      const serviceTodoClone = serviceTodo.clone()

      serviceTodoClone.owners = [
        { id: 1, name: 'Marshall' },
        { id: 2, name: 'Mariah' }
      ]
      assert.deepEqual(
        serviceTodo.owners,
        owners,
        'original todo remained unchanged'
      )

      serviceTodoClone.commit()

      assert.deepEqual(
        serviceTodo.owners,
        [owners[0], owners[1]],
        'ownerIds were updated properly'
      )
    })

    it(`no longer changes original if you don't use the return value of commit()`, function() {
      const { serviceTodo, owners } = this
      const serviceTodoClone = serviceTodo.clone()

      assert.deepEqual(
        serviceTodo.owners,
        owners,
        'original todo remained unchanged'
      )

      serviceTodoClone.commit()
      serviceTodoClone.owners[0].name = 'Ted'

      assert.deepEqual(
        serviceTodo.owners[0].name,
        'Marshall',
        'nested object in original todo was unchanged'
      )
    })

    it(`doesn't change the original if you modify return value of a commit`, function() {
      const { serviceTodo, owners } = this
      let serviceTodoClone = serviceTodo.clone()

      assert.deepEqual(
        serviceTodo.owners,
        owners,
        'original todo remained unchanged'
      )

      serviceTodoClone = serviceTodoClone.commit()
      serviceTodoClone.owners[0].name = 'Ted'

      assert.deepEqual(
        serviceTodo.owners[0].name,
        'Marshall',
        'nested object in original todo was NOT changed'
      )
    })

    it('allows reseting copy changes back to match the original', function() {
      const { serviceTodo } = this
      let serviceTodoClone = serviceTodo.clone()

      serviceTodoClone.description = 'Do something else'
      serviceTodoClone.reset()

      assert(
        serviceTodo.description === 'Do the dishes',
        'the original todo was untouched'
      )
      assert(
        serviceTodoClone.description === 'Do the dishes',
        'the clone was reset to match the original'
      )
    })

    it('adds additional properties to model instances when more data arrives for the same id', function() {
      const { serviceTodo, owners } = this
      const newData = {
        id: 1,
        description: 'Do the dishes',
        isComplete: false,
        owners,
        test: true
      }
      const newTodo = new serviceTodo.constructor(newData)

      assert(newTodo === serviceTodo, 'the records are the same')
      assert(newTodo.test === true, 'the new attribute was added')
      assert(
        serviceTodo.test === true,
        'the new attribute was also added to the original'
      )
    })

    it('ignores when new data with matching id has fewer props than current record', function() {
      const { serviceTodo, owners } = this
      const newData = {
        id: 1,
        owners
      }
      const newTodo = new serviceTodo.constructor(newData)

      assert(newTodo === serviceTodo, 'the records are the same')
      assert(
        serviceTodo.description === 'Do the dishes',
        'the existing attributes remained in place'
      )
      assert(
        serviceTodo.isComplete === false,
        'the existing attributes remained in place'
      )
    })

    it('updates the new record when non-null, non-undefined values do not match', function() {
      const { serviceTodo, owners } = this
      const newData = {
        id: 1,
        description: 'Do the mopping',
        isComplete: true,
        owners
      }
      const newTodo = new serviceTodo.constructor(newData)

      assert(newTodo === serviceTodo, 'the records are the same')
      assert(
        serviceTodo.description === 'Do the mopping',
        'non-matching string was updated'
      )
      assert(
        serviceTodo.isComplete === true,
        'non-matching boolean was updated'
      )
    })
  })

  describe('Models - modelName', function() {
    beforeEach(function() {
      const { makeServicePlugin, HotspotMedia, Media } = this
      this.store = new Vuex.Store<RootState>({
        strict: true,
        plugins: [
          makeServicePlugin({
            Model: HotspotMedia,
            service: feathersClient.service('hotspot-media')
          }),
          makeServicePlugin({
            Model: Media,
            service: feathersClient.service('media')
          }),
          makeServicePlugin({
            Model: HotspotMedia,
            service: feathersClient.service('hotspot-media')
          })
        ]
      })
      this.Medium = models.Medium
      this.HotspotMedia = models.HotspotMedia
    })

    it('allows passing a custom Model name', function() {
      assert(!this.HotspotMedium, `the model wasn't in the default location`)
      assert(this.HotspotMedia, 'the model is named correctly.')
    })
  })

  describe('Models - Dates', function() {
    beforeEach(function() {
      const { makeServicePlugin, ServiceTodo } = this
      const instanceDefaults = {
        id: null,
        description: '',
        isComplete: false,
        createdAt: Date
      }
      this.store = new Vuex.Store<RootState>({
        strict: true,
        plugins: [
          makeServicePlugin({
            Model: ServiceTodo,
            service: feathersClient.service('service-todos')
          })
        ]
      })
      this.Todo = ServiceTodo
    })

    it('converts keys that contain the Date constructor into date instances', function() {
      const { Todo } = this
      const createdAt = '2018-05-01T04:42:24.136Z'
      const module = new Todo({
        description: 'Go on a date.',
        isComplete: true,
        createdAt
      })

      assert(
        typeof module.createdAt === 'object',
        'module.createdAt is an instance of object'
      )
      assert(
        module.createdAt.constructor.name === 'Date',
        'module.createdAt is an instance of date'
      )
      assert(
        module.createdAt.toString() === new Date(createdAt).toString(),
        'the correct date was used'
      )
    })
  })

  describe('Models - Relationships', function() {
    beforeEach(function() {
      const { makeServicePlugin, BaseModel } = this
      class Task extends BaseModel {
        public static instanceDefaults: {
          id: null
          description: ''
          isComplete: false
        }
      }
      class ServiceTodo extends BaseModel {
        public static instanceDefaults(data) {
          const priority = data.priority || 'normal'
          const defaultsByPriority = {
            normal: {
              description: '',
              isComplete: false,
              task: 'Task',
              item: 'Item',
              priority: ''
            },
            high: {
              isHighPriority: true,
              priority: ''
            }
          }
          return defaultsByPriority[priority]
        }
      }
      class Item extends BaseModel {
        public static instanceDefaults({ Models }) {
          return {
            test: false,
            todo: 'Todo',
            get todos() {
              return Models.Todo.findInStore({ query: {} }).data
            }
          }
        }
      }
      this.store = new Vuex.Store<RootState>({
        strict: true,
        plugins: [
          makeServicePlugin({
            Model: Task,
            service: feathersClient.service('tasks')
          }),
          makeServicePlugin({
            Model: ServiceTodo,
            service: feathersClient.service('service-todos')
          }),
          makeServicePlugin({
            Model: Item,
            service: feathersClient.service('items'),
            mutations: {
              toggleTestBoolean(state, item) {
                item.test = !item.test
              }
            }
          })
        ]
      })
      this.Todo = ServiceTodo
      this.Task = models.Task
      this.Item = models.Item
    })

    it('can setup relationships through es5 getters in instanceDefaults', function() {
      const { Item, Todo } = this
      const module = new Todo({ id: 5, description: 'hey' })
      const item = new Item({})

      assert(Array.isArray(item.todos), 'Received an array of todos')
      assert(
        item.todos[0] === module,
        'The todo was returned through the getter'
      )
    })

    it('can have different instanceDefaults based on new instance data', function() {
      const { Todo } = this
      const normalTodo = new Todo({
        description: 'Normal'
      })
      const highPriorityTodo = new Todo({
        description: 'High Priority',
        priority: 'high'
      })

      assert(
        !normalTodo.hasOwnProperty('isHighPriority'),
        'Normal todos do not have an isHighPriority default attribute'
      )
      assert(
        highPriorityTodo.isHighPriority,
        'High priority todos have a unique attribute'
      )
    })

    it('converts keys that match Model names into Model instances', function() {
      const { Todo, store } = this
      const module = new Todo({
        task: {
          description: 'test',
          isComplete: true
        }
      })

      assert(
        module.task.constructor.className === 'Task',
        'task is an instance of Task'
      )
      assert.deepEqual(
        store.state.tasks.keyedById,
        {},
        'nothing was added to the store'
      )
    })

    it('adds model instances containing an id to the store', function() {
      const { Todo, store } = this

      const module = new Todo({
        task: {
          id: 1,
          description: 'test',
          isComplete: true
        }
      })

      assert.deepEqual(
        store.state.tasks.keyedById[1],
        module.task,
        'task was added to the store'
      )
    })

    it('works with multiple keys that match Model names', function() {
      const { Todo, store } = this

      const module = new Todo({
        task: {
          id: 1,
          description: 'test',
          isComplete: true
        },
        item: {
          id: 2,
          test: true
        }
      })

      assert.deepEqual(
        store.state.tasks.keyedById[1],
        module.task,
        'task was added to the store'
      )
      assert.deepEqual(
        store.state.items.keyedById[2],
        module.item,
        'item was added to the store'
      )
    })

    it('handles nested relationships', function() {
      const { Todo } = this

      const module = new Todo({
        task: {
          id: 1,
          description: 'test',
          isComplete: true
        },
        item: {
          id: 2,
          test: true,
          todo: {
            description: 'nested todo under item'
          }
        }
      })

      assert(
        module.item.module.constructor.className === 'Todo',
        'the nested todo is an instance of Todo'
      )
    })

    it('handles recursive nested relationships', function() {
      const { Todo, store } = this

      const module = new Todo({
        id: 1,
        description: 'todo description',
        item: {
          id: 2,
          test: true,
          todo: {
            id: 1,
            description: 'todo description'
          }
        }
      })

      assert.deepEqual(
        store.state.todos.keyedById[1],
        module,
        'todo was added to the store'
      )
      assert.deepEqual(
        store.state.items.keyedById[2],
        module.item,
        'item was added to the store'
      )
      assert(module.item, 'todo still has an item')
      assert(module.item.module, 'todo still nested in itself')
    })

    it('updates related data', function() {
      const { Todo, store } = this

      const module = new Todo({
        id: 'todo-1',
        description: 'todo description',
        item: {
          id: 'item-2',
          test: true,
          todo: {
            id: 'todo-1',
            description: 'todo description'
          }
        }
      })

      const storedTodo = store.state.todos.keyedById['todo-1']
      const storedItem = store.state.items.keyedById['item-2']

      store.commit('items/toggleTestBoolean', storedItem)
      // module.item.test = false

      assert.equal(
        module.item.test,
        false,
        'the nested module.item.test should be false'
      )
      assert.equal(
        storedTodo.item.test,
        false,
        'the nested item.test should be false'
      )
      assert.equal(storedItem.test, false, 'item.test should be false')
    })

    it(`allows creating more than once relational instance`, function() {
      const { Todo, store } = this

      const todo1 = new Todo({
        id: 'todo-1',
        description: 'todo description',
        item: {
          id: 'item-2',
          test: true
        }
      })
      const todo2 = new Todo({
        id: 'todo-2',
        description: 'todo description',
        item: {
          id: 'item-3',
          test: true
        }
      })

      const storedTodo = store.state.todos.keyedById['todo-2']
      const storedItem = store.state.items.keyedById['item-3']

      assert.equal(
        todo1.item.test,
        true,
        'the nested module.item.test should be true'
      )
      assert.equal(
        todo2.item.test,
        true,
        'the nested module.item.test should be true'
      )
      assert.equal(
        storedTodo.item.test,
        true,
        'the nested item.test should be true'
      )
      assert.equal(storedItem.test, true, 'item.test should be true')
    })

    it(`handles arrays of related data`, function() {
      const { Todo, store } = this

      const todo1 = new Todo({
        id: 'todo-1',
        description: 'todo description',
        item: [
          {
            id: 'item-1',
            test: true
          },
          {
            id: 'item-2',
            test: true
          }
        ]
      })
      const todo2 = new Todo({
        id: 'todo-2',
        description: 'todo description',
        item: [
          {
            id: 'item-3',
            test: true
          },
          {
            id: 'item-4',
            test: true
          }
        ]
      })

      assert(todo1, 'todo1 is an instance')
      assert(todo2, 'todo2 is an instance')

      const storedTodo1 = store.state.todos.keyedById['todo-1']
      const storedTodo2 = store.state.todos.keyedById['todo-2']
      const storedItem1 = store.state.items.keyedById['item-1']
      const storedItem2 = store.state.items.keyedById['item-2']
      const storedItem3 = store.state.items.keyedById['item-3']
      const storedItem4 = store.state.items.keyedById['item-4']

      assert(storedTodo1, 'should have todo 1')
      assert(storedTodo2, 'should have todo 2')
      assert(storedItem1, 'should have item 1')
      assert(storedItem2, 'should have item 2')
      assert(storedItem3, 'should have item 3')
      assert(storedItem4, 'should have item 4')
    })
  })

  describe('Setting Up', () => {
    it('service stores have global defaults', function() {
      const { makeServicePlugin, BaseModel, Task } = this
      class Todo extends BaseModel {
        public static test: boolean = true
      }
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: Task,
            service: feathersClient.service('tasks')
          }),
          makeServicePlugin({
            Model: Todo,
            service: feathersClient.service('/v2/todos')
          })
        ]
      })
      const { state } = store

      assert(state.tasks.idField === 'id', 'default idField is `id`')
      assert(state.tasks.autoRemove === false, 'autoRemove is off by default')
      assert(state.todos, 'uses `short` nameStyle by default')
    })

    it('can customize the idField for each service', function() {
      const { makeServicePlugin, Test } = this
      const idField = '_id'
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            idField,
            Model: Test,
            service: feathersClient.service('tests')
          })
        ]
      })

      assert(
        store.state.tests.idField === idField,
        'the idField was properly set'
      )
    })

    it('allows enabling autoRemove', function() {
      const { makeServicePlugin, Test } = this
      const autoRemove = true
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: Test,
            service: feathersClient.service('tests')
          })
        ]
      })

      assert(
        store.state.tests.autoRemove === autoRemove,
        'the autoRemove was enabled'
      )
    })

    it('can switch to path name as namespace', function() {
      const { makeServicePlugin, Test } = this
      const nameStyle = 'path'
      const serviceName = '/v1/tests'
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: Test,
            service: feathersClient.service(serviceName),
            nameStyle
          })
        ]
      })
      const namespace = stripSlashes(serviceName)

      assert(
        store.state[namespace],
        'the full path name was used as a namespace'
      )
    })

    it('can explicitly provide a namespace', function() {
      const { makeServicePlugin, Test } = this
      const namespace = 'blah'
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: Test,
            service: feathersClient.service('/v1/tests'),
            namespace
          })
        ]
      })
      assert(store.state.blah, 'the namespace option was used as the namespace')
    })

    it('prioritizes the explicit namespace', function() {
      const { makeServicePlugin, Test } = this
      const namespace = 'blah'
      const nameStyle = 'path'
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: Test,
            service: feathersClient.service('/v1/tests'),
            namespace,
            nameStyle
          })
        ]
      })
      assert(store.state.blah, 'the namespace option was used as the namespace')
    })
  })

  describe('Basics', () => {
    beforeEach(function() {
      this.feathers = makeFeathersRestClient()
      this.feathers.use('service-todos', memory({ store: makeTodos() }))
      this.fv = feathersVuex(this.feathers, {
        serverAlias: 'basics'
      })
      class ServiceTodo extends this.fv.BaseModel {
        public static test: boolean = true
      }
      this.ServiceTodo = ServiceTodo
    })

    it('populates default store', function() {
      const store = new Vuex.Store<RootState>({
        plugins: [
          this.fv.makeServicePlugin({
            Model: this.ServiceTodo,
            service: this.feathers.service('service-todos')
          })
        ]
      })
      const todoState = store.state['service-todos']
      const expectedState = {
        autoRemove: false,
        copiesById: {},
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
        modelName: 'Todo',
        addOnUpsert: false,
        diffOnPatch: false,
        skipRequestIfExists: false,
        preferUpdate: false,
        replaceItems: false,
        servicePath: 'service-todos',
        pagination: {},
        paramsForServer: [],
        whitelist: []
      }

      assert.deepEqual(
        todoState,
        expectedState,
        'the expected state was returned'
      )
    })

    it('throws an error if first arg is not a string', function() {
      const { service } = this
      try {
        new Vuex.Store({
          // eslint-disable-line no-new
          plugins: [service({})]
        })
      } catch (error) {
        assert(
          error.message ===
            'The first argument to setup a feathers-vuex service must be a string',
          'threw an error'
        )
      }
    })

    it(`populates items on find`, function(done) {
      const store = new Vuex.Store<RootState>({
        plugins: [this.service('service-todos', { idField: '_id' })]
      })

      const todoState = store.state.todos

      assert(todoState.ids.length === 0)

      store
        .dispatch('todos/find', { query: {} })
        .then(todos => {
          assert(todoState.ids.length === 3)
          done()
        })
        .catch(error => {
          assert(!error, error.message)
          done()
        })
    })

    describe('Auto-remove items', function() {
      beforeEach(function() {
        this.feathersClient = makeFeathersRestClient()
        this.feathersClient.use(
          'service-todos',
          memory({
            store: makeTodos()
          })
        )
        this.feathersClient.use(
          'tasks',
          memory({
            store: makeTodos(),
            paginate: {
              default: 10,
              max: 50
            }
          })
        )
        this.fv = feathersVuex(this.feathersClient, {
          serverAlias: 'auto-remove'
        })
      })

      it(`removes missing items when pagination is off`, function(done) {
        const store = new Vuex.Store<RootState>({
          plugins: [
            this.service('service-todos', {
              idField: '_id',
              autoRemove: true
            })
          ]
        })

        const todoState = store.state['service-todos']

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store
          .dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('service-todos').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(
              todoState.ids.length === 3,
              'there are still three items in the store'
            )

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(
              todoState.ids.length === 2,
              'there are now two items in the store'
            )
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when pagination is on`, function(done) {
        const store = new Vuex.Store<RootState>({
          plugins: [this.service('tasks', { idField: '_id', autoRemove: true })]
        })

        const taskState = store.state.tasks

        assert(taskState.ids.length === 0)

        // Load some data into the store
        store
          .dispatch('tasks/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('tasks').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(
              taskState.ids.length === 3,
              'there are still three items in the store'
            )

            // Perform the same query again
            return store.dispatch('tasks/find', { query: {} })
          })
          .then(todos => {
            assert(todos.hasOwnProperty('total'), 'pagination is on')
            assert(
              taskState.ids.length === 3,
              'there are still three items in the store'
            )
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when autoRemove is off`, function(done) {
        const store = new Vuex.Store<RootState>({
          plugins: [
            this.service('service-todos', {
              idField: '_id',
              autoRemove: false
            })
          ]
        })
        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store
          .dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('service-todos').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(
              todoState.ids.length === 3,
              'there are still three items in the store'
            )

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(
              todoState.ids.length === 3,
              'there are still three items in the store'
            )
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })
    })
  })

  describe('Customizing Service Stores', function() {
    it('allows adding custom state', function() {
      const { makeServicePlugin, ServiceTodo } = this

      const customState = {
        test: true,
        test2: {
          test: true
        }
      }
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: ServiceTodo,
            service: feathersClient.service('service-todos'),
            state: customState
          })
        ]
      })

      assert(store.state.todos.test === true, 'added custom state')
      assert(store.state.todos.test2.test === true, 'added custom state')
    })

    it('allows custom mutations', function() {
      const { makeServicePlugin, ServiceTodo } = this
      const state = { test: true }
      const customMutations = {
        setTestToFalse(state) {
          state.test = false
        }
      }
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: ServiceTodo,
            service: feathersClient.service('service-todos'),
            state,
            mutations: customMutations
          })
        ]
      })

      store.commit('todos/setTestToFalse')
      assert(
        store.state.todos.test === false,
        'the custom state was modified by the custom mutation'
      )
    })

    it('allows custom getters', function() {
      const { makeServicePlugin, ServiceTodo } = this
      const customGetters = {
        oneTwoThree(state) {
          return 123
        }
      }
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: ServiceTodo,
            service: feathersClient.service('service-todos'),
            getters: customGetters
          })
        ]
      })

      assert(
        store.getters['todos/oneTwoThree'] === 123,
        'the custom getter was available'
      )
    })

    it('allows adding custom actions', function() {
      const { makeServicePlugin, ServiceTodo } = this
      const config = {
        state: {
          isTrue: false
        },
        mutations: {
          setToTrue(state) {
            state.isTrue = true
          }
        },
        actions: {
          trigger(context) {
            context.commit('setToTrue')
          }
        }
      }
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: ServiceTodo,
            service: feathersClient.service('service-todos'),
            ...config
          })
        ]
      })

      store.dispatch('todos/trigger')
      assert(store.state.todos.isTrue === true, 'the custom action was run')
    })
  })

  describe.skip('Updates the Store on Events', function() {
    const fv = feathersVuex(feathersSocketioClient, {
      serverAlias: 'updates-store-on-events'
    })

    it('created', function(done) {
      const { Thing } = this
      const store = new Vuex.Store<RootState>({
        plugins: [
          fv.makeServicePlugin({
            Model: Thing,
            service: feathersSocketioClient.service('things')
          })
        ]
      })

      feathersSocketioClient.service('things').on('created', item => {
        assert(
          store.state.things.keyedById[0].test,
          'the item received from the socket event was added to the store'
        )
        done()
      })

      feathersSocketioClient.service('things').create({ test: true })
    })

    it('patched', function(done) {
      const { Thing } = this
      const store = new Vuex.Store<RootState>({
        plugins: [
          fv.makeServicePlugin({
            Model: Thing,
            service: feathersSocketioClient.service('things')
          })
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('patched', item => {
        assert(
          store.state.things.keyedById[1].test,
          'the item received from the socket event was updated in the store'
        )
        done()
      })

      feathersSocketioClient.service('things').patch(1, { test: true })
    })

    it('updated', function(done) {
      const { Thing } = this
      const store = new Vuex.Store<RootState>({
        plugins: [
          fv.makeServicePlugin({
            Model: Thing,
            service: feathersSocketioClient.service('things')
          })
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('updated', item => {
        assert(
          store.state.things.keyedById[1].test,
          'the item received from the socket event was updated in the store'
        )
        done()
      })

      feathersSocketioClient.service('things').update(1, { test: true })
    })

    it('removed', function(done) {
      const { Thing } = this
      const store = new Vuex.Store<RootState>({
        plugins: [
          fv.makeServicePlugin({
            Model: Thing,
            service: feathersSocketioClient.service('things')
          })
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('removed', item => {
        assert(
          !store.state.things.keyedById[1],
          'the item received from the socket event was removed from the store'
        )
        done()
      })

      feathersSocketioClient.service('things').remove(1)
    })
  })
})
