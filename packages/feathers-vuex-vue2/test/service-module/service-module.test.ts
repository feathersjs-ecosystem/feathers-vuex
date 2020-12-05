/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { ServiceState } from './types'
import { assert } from 'chai'
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
import { performance } from 'perf_hooks'
import enableServiceEvents from '../../src/service-module/service-module.events'
import { Service } from '@feathersjs/feathers'

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
    public static modelName = 'ServiceTodo'
    public id
    public description: string

    public constructor(data, options?) {
      super(data, options)
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static instanceDefaults(data) {
      return {
        description: ''
      }
    }
  }
  class HotspotMedia extends BaseModel {
    public static modelName = 'HotspotMedia'
    public id
    public description: string
  }
  class Media extends BaseModel {
    public static modelName = 'Media'
    public id
    public description: string
  }
  class Person extends BaseModel {
    public static modelName = 'Person'
    public static test = true
  }
  class Item extends BaseModel {
    public static modelName = 'Item'
    public static test = true
  }
  class Task extends BaseModel {
    public static modelName = 'Task'
    public static test = true
  }
  class Car extends BaseModel {
    public static modelName = 'Car'
    public static test = true
  }
  class Group extends BaseModel {
    public static modelName = 'Group'
    public static test = true
  }
  class Test extends BaseModel {
    public static modelName = 'Test'
    public static test = true
  }
  class Thing extends BaseModel {
    public static modelName = 'Thing'
    public static test = true
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

function makeContextWithState() {
  const feathers = makeFeathersRestClient()
  const service = feathers.use('service-todos', memory({ store: makeTodos() }))
  const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
    serverAlias: 'basics'
  })
  class ServiceTodo extends BaseModel {
    public static modelName = 'ServiceTodo'

    public static test = true
  }

  return {
    feathers,
    service,
    makeServicePlugin,
    BaseModel,
    ServiceTodo
  }
}

function makeAutoRemoveContext() {
  const feathers = makeFeathersRestClient()
    .use(
      'todos',
      memory({
        store: makeTodos()
      })
    )
    .use(
      'tasks',
      memory({
        store: makeTodos(),
        paginate: {
          default: 10,
          max: 50
        }
      })
    )
  const todosService = feathers.service('todos')
  const tasksService = feathers.service('tasks')
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'autoRemove'
  })
  class Todo extends BaseModel {
    public static modelName = 'Todo'
    public static servicePath = 'todos'
    public static test = true
  }
  class Task extends BaseModel {
    public static modelName = 'Task'
    public static servicePath = 'tasks'
    public static test = true
  }
  return {
    feathers,
    todosService,
    tasksService,
    makeServicePlugin,
    BaseModel,
    Todo,
    Task
  }
}

function makeSocketIoContext() {
  const { makeServicePlugin, BaseModel } = feathersVuex(
    feathersSocketioClient,
    {
      serverAlias: 'updates-store-on-events'
    }
  )

  class Thing extends BaseModel {
    public static modelName = 'Thing'
    public static test = true
    public constructor(data = {}, options?) {
      super(data, options)
    }
  }

  class ThingDebounced extends BaseModel {
    public static modelName = 'ThingDebounced'
    public static test = true
    public constructor(data = {}, options?) {
      super(data, options)
    }
  }

  class TodoDebounced extends BaseModel {
    public static modelName = 'TodoDebounced'
    public static test = true
    public constructor(data = {}, options?) {
      super(data, options)
    }
  }

  const store = new Vuex.Store<RootState>({
    strict: true,
    plugins: [
      makeServicePlugin({
        Model: Thing,
        service: feathersSocketioClient.service('things'),
        servicePath: 'things'
      }),
      makeServicePlugin({
        Model: ThingDebounced,
        service: feathersSocketioClient.service('things-debounced'),
        servicePath: 'things-debounced',
        debounceEventsTime: 20,
        namespace: 'things-debounced'
      }),
      makeServicePlugin({
        Model: TodoDebounced,
        service: feathersSocketioClient.service('todos-debounced'),
        servicePath: 'todos-debounced',
        debounceEventsTime: 20,
        namespace: 'todos-debounced'
      })
    ]
  })

  const debouncedQueue = enableServiceEvents({
    Model: TodoDebounced,
    service: feathersSocketioClient.service('todos-debounced'),
    store,
    options: store.state['todos-debounced']
  })

  return {
    feathersSocketioClient,
    makeServicePlugin,
    BaseModel,
    Thing,
    ThingDebounced,
    TodoDebounced,
    store,
    debouncedQueue
  }
}

describe('Service Module', function () {
  beforeEach(() => {
    clearModels()
  })

  it('registers a vuex plugin and Model for the service', function () {
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

  describe('Models', function () {
    beforeEach(function () {
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

    it('allows creating model clones', function () {
      const { ServiceTodo } = this
      const serviceTodoClone = this.serviceTodo.clone()

      assert(
        serviceTodoClone.__isClone,
        'created a todo clone with isClone attribute'
      )
      assert(
        serviceTodoClone instanceof ServiceTodo,
        'the copy is an instance of the same class'
      )
    })

    it('allows modifying clones without affecting the original', function () {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()

      serviceTodoClone.description = 'Do something else'

      assert(
        serviceTodo.description === 'Do the dishes',
        'the original todo remained intact'
      )
    })

    it('allows commiting changes back to the original in the store', function () {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()

      serviceTodoClone.description = 'Do something else'
      serviceTodoClone.commit()

      assert(
        serviceTodo.description === 'Do something else',
        'the original todo was updated'
      )
    })

    it('performs a shallow merge when commiting back to the original record', function () {
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

    it(`the object returned from clone is not the same as the original`, function () {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()

      assert(serviceTodo !== serviceTodoClone, 'the objects are distinct')
    })

    it(`the object returned from commit is not the same as the clone`, function () {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()
      const committedTodo = serviceTodoClone.commit()

      assert(committedTodo !== serviceTodoClone, 'the objects are distinct')
    })

    it(`the object returned from commit is the same as the original`, function () {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()
      const committedTodo = serviceTodoClone.commit()

      assert(serviceTodo === committedTodo, 'the objects are the same')
    })

    it(`nested arrays are distinct after clone`, function () {
      const { ServiceTodo } = this

      const todo = new ServiceTodo({
        description: 'test',
        owners: ['Marshall', 'Mariah']
      })
      const clone = todo.clone()

      assert(
        todo.owners !== clone.owners,
        'the arrays are not the same in memory'
      )
    })

    it.skip(`modifying a clone after calling commit() does not change the original `, function () {
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

    it(`changes the original if you modify return value of a commit`, function () {
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
        'Ted',
        'nested object in original todo was changed'
      )
    })

    it(`allows shallow assign of data when cloning`, function () {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone({
        isComplete: !serviceTodo.isComplete
      })

      assert.equal(
        !serviceTodo.isComplete,
        serviceTodoClone.isComplete,
        'clone value has changed'
      )

      serviceTodoClone.commit()

      assert.equal(
        serviceTodo.isComplete,
        true,
        'value has changed after commit'
      )
    })

    it('allows reseting copy changes back to match the original', function () {
      const { serviceTodo } = this
      const serviceTodoClone = serviceTodo.clone()

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

    it('adds additional properties to model instances when more data arrives for the same id', function () {
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

    it('ignores when new data with matching id has fewer props than current record', function () {
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

    it('updates the new record when non-null, non-undefined values do not match', function () {
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

  describe('Setting Up', () => {
    it('service stores have global defaults', function () {
      const { makeServicePlugin, BaseModel, Task } = makeContext()
      class Todo extends BaseModel {
        public static modelName = 'Todo'
        public static test = true
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

    it('can customize the idField for each service', function () {
      const { makeServicePlugin, Test, Person } = makeContext()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            idField: '_id',
            Model: Test,
            service: feathersClient.service('tests')
          }),
          makeServicePlugin({
            idField: 'name',
            Model: Person,
            service: feathersClient.service('people')
          })
        ]
      })

      assert(
        store.state.tests.idField === '_id',
        'the idField was properly set'
      )
      assert(
        // @ts-ignore
        store.state.people.idField === 'name',
        'the idField was properly set'
      )
    })

    it('allows enabling autoRemove', function () {
      const { makeServicePlugin, Test } = makeContext()
      const autoRemove = true
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            Model: Test,
            service: feathersClient.service('tests'),
            autoRemove
          })
        ]
      })

      assert(
        store.state.tests.autoRemove === autoRemove,
        'the autoRemove was enabled'
      )
    })

    it('can switch to path name as namespace', function () {
      const { makeServicePlugin, Test } = makeContext()
      const plugin = makeServicePlugin({
        Model: Test,
        service: feathersClient.service('/v1/tests'),
        nameStyle: 'path'
      })
      const store = new Vuex.Store<RootState>({
        plugins: [plugin]
      })
      const namespace = stripSlashes('/v1/tests')

      assert(
        store.state[namespace],
        'the full path name was used as a namespace'
      )
    })

    it('can explicitly provide a namespace', function () {
      const { makeServicePlugin, Test } = makeContext()
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

    it('prioritizes the explicit namespace', function () {
      const { makeServicePlugin, Test } = makeContext()
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
    it('populates default store', function () {
      const {
        makeServicePlugin,
        feathers,
        ServiceTodo
      } = makeContextWithState()
      const store = new Vuex.Store<RootState>({
        plugins: [
          makeServicePlugin({
            servicePath: 'service-todos',
            Model: ServiceTodo,
            service: feathers.service('service-todos')
          })
        ]
      })
      const todoState = store.state['service-todos']
      const expectedState = {
        addOnUpsert: false,
        autoRemove: false,
        copiesById: {},
        debug: false,
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
        keepCopiesInStore: false,
        debounceEventsTime: null,
        debounceEventsMaxWait: 1000,
        keyedById: {},
        nameStyle: 'short',
        namespace: 'service-todos',
        modelName: 'ServiceTodo',
        serverAlias: 'basics',
        skipRequestIfExists: false,
        preferUpdate: false,
        replaceItems: false,
        servicePath: 'service-todos',
        tempIdField: '__id',
        tempsById: {},
        pagination: {
          defaultLimit: null,
          defaultSkip: null
        },
        paramsForServer: ['$populateParams'],
        whitelist: [],
        isIdCreatePending: [],
        isIdUpdatePending: [],
        isIdPatchPending: [],
        isIdRemovePending: []
      }

      assert.deepEqual(
        todoState,
        expectedState,
        'the expected state was returned'
      )
    })

    it('throws an error if no service is provided', function () {
      const { makeServicePlugin } = makeContext()
      try {
        new Vuex.Store({
          // @ts-ignore
          plugins: [makeServicePlugin({})]
        })
      } catch (error) {
        assert.equal(
          error.message,
          'No service was provided. If you passed one in, check that you have configured a transport plugin on the Feathers Client. Make sure you use the client version of the transport.',
          'threw an error'
        )
      }
    })

    describe('Auto-Remove Items', function () {
      beforeEach(function () {
        clearModels()
      })

      it(`removes missing items when pagination is off`, function (done) {
        const {
          makeServicePlugin,
          Todo,
          todosService
        } = makeAutoRemoveContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              Model: Todo,
              service: todosService,
              idField: '_id',
              autoRemove: true
            })
          ]
        })

        const todoState = store.state['todos']

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store
          .dispatch('todos/find', { query: {} })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .then(todos => {
            // Remove the third item from the service
            // @ts-ignore
            delete todosService.store[3]
            // We went around using the store actions, so there will still be three items.
            assert(
              todoState.ids.length === 3,
              'there are still three items in the store'
            )

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      it(`does not remove missing items when pagination is on`, function (done) {
        const {
          makeServicePlugin,
          Task,
          tasksService
        } = makeAutoRemoveContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              Model: Task,
              service: tasksService,
              idField: '_id',
              autoRemove: true
            })
          ]
        })

        const taskState = store.state.tasks

        assert(taskState.ids.length === 0)

        // Load some data into the store
        store
          .dispatch('tasks/find', { query: {} })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .then(todos => {
            // Remove the third item from the service
            // @ts-ignore
            delete tasksService.store[3]
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

      it(`does not remove missing items when autoRemove is off`, function (done) {
        const {
          makeServicePlugin,
          Todo,
          todosService
        } = makeAutoRemoveContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              Model: Todo,
              service: todosService,
              idField: '_id'
            })
          ]
        })

        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store
          .dispatch('todos/find', { query: {} })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .then(todos => {
            // Remove the third item from the service
            // @ts-ignore
            delete todosService.store[3]
            // We went around using the store actions, so there will still be three items.
            assert(
              todoState.ids.length === 3,
              'there are still three items in the store'
            )

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  describe('Customizing Service Stores', function () {
    describe('New "extend" method', () => {
      it('allows access to the store and default module', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()

        new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              Model: ServiceTodo,
              service: feathersClient.service('service-todos'),
              extend: ({ store, module }) => {
                assert.ok(store, 'should have received received the store')
                assert.ok(module.state, 'should have default state')
                assert.ok(module.getters, 'should have default getters')
                assert.ok(module.mutations, 'should have default mutations')
                assert.ok(module.actions, 'should have default actions')
                assert.ok(module.namespaced, 'should have default namespaced')
                return {}
              }
            })
          ]
        })
      })

      it('allows adding custom state', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()

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
              extend: () => {
                return {
                  state: customState
                }
              }
            })
          ]
        })

        assert(store.state['service-todos'].test === true, 'added custom state')
        assert(
          store.state['service-todos'].test2.test === true,
          'added custom state'
        )
      })

      it('allows custom mutations', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()
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
              extend: () => ({
                state,
                mutations: customMutations
              })
            })
          ]
        })

        store.commit('service-todos/setTestToFalse')
        assert(
          store.state['service-todos'].test === false,
          'the custom state was modified by the custom mutation'
        )
      })

      it('allows custom getters', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()
        const customGetters = {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          oneTwoThree(state) {
            return 123
          }
        }
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              Model: ServiceTodo,
              service: feathersClient.service('service-todos'),
              extend: () => ({
                getters: customGetters
              })
            })
          ]
        })

        assert(
          store.getters['service-todos/oneTwoThree'] === 123,
          'the custom getter was available'
        )
      })

      it('allows adding custom actions', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()
        const store = new Vuex.Store<RootState>({
          plugins: [
            makeServicePlugin({
              Model: ServiceTodo,
              service: feathersClient.service('service-todos'),
              extend: () => ({
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
              })
            })
          ]
        })

        store.dispatch('service-todos/trigger')
        assert(
          store.state['service-todos'].isTrue === true,
          'the custom action was run'
        )
      })
    })

    describe('Deprecated options', () => {
      it('allows adding custom state', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()

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

        assert(store.state['service-todos'].test === true, 'added custom state')
        assert(
          store.state['service-todos'].test2.test === true,
          'added custom state'
        )
      })

      it('allows custom mutations', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()
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

        store.commit('service-todos/setTestToFalse')
        assert(
          store.state['service-todos'].test === false,
          'the custom state was modified by the custom mutation'
        )
      })

      it('allows custom getters', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()
        const customGetters = {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          store.getters['service-todos/oneTwoThree'] === 123,
          'the custom getter was available'
        )
      })

      it('allows adding custom actions', function () {
        const { makeServicePlugin, ServiceTodo } = makeContext()
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

        store.dispatch('service-todos/trigger')
        assert(
          store.state['service-todos'].isTrue === true,
          'the custom action was run'
        )
      })
    })
  })

  describe('Updates the Store on Events', function () {
    let feathersSocketioClient,
      debouncedQueue,
      store,
      debouncedService: Service<any>
    beforeEach(() => {
      const context = makeSocketIoContext()
      feathersSocketioClient = context.feathersSocketioClient
      debouncedQueue = context.debouncedQueue
      store = context.store
      debouncedService = feathersSocketioClient.service('things-debounced')
    })

    it('created', function (done) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const listener = item => {
        assert(
          // @ts-ignore
          store.state.things.keyedById[0].test,
          'the item received from the socket event was added to the store'
        )

        feathersSocketioClient.service('things').off('created', listener)

        done()
      }
      feathersSocketioClient.service('things').on('created', listener)

      feathersSocketioClient.service('things').create({ test: true })
    })

    it('created debounced', function (done) {
      const { debounceEventsTime } = store.state['things-debounced']

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const listener = item => {
        assert(
          !store.state['things-debounced'].keyedById[0],
          'the item is not added immediately'
        )
        setTimeout(() => {
          assert(
            store.state['things-debounced'].keyedById[0].test,
            'the item received from the socket event was added to the store'
          )
          debouncedService.off('created', listener)
          done()
        }, debounceEventsTime * 2)
      }
      debouncedService.on('created', listener)
      debouncedService.create({ test: true })
    })

    it('patched', function (done) {
      store.commit('things/addItem', { id: 1, test: false })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      feathersSocketioClient.service('things').on('patched', item => {
        assert(
          store.state.things.keyedById[1].test,
          'the item received from the socket event was updated in the store'
        )
        done()
      })

      feathersSocketioClient.service('things').patch(1, { test: true })
    })

    it('patched debounced', function (done) {
      const { debounceEventsTime } = store.state['things-debounced']

      store.commit('things-debounced/clearAll')
      store.commit('things-debounced/addItem', { id: 1, test: false })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const listener = item => {
        assert(
          !store.state['things-debounced'].keyedById[1].test,
          'the item is not updated immediately'
        )
        setTimeout(() => {
          assert(
            store.state['things-debounced'].keyedById[1].test,
            'the item received from the socket event was updated in the store'
          )
        }, debounceEventsTime * 2)
        debouncedService.off('patched', listener)
        done()
      }

      debouncedService.on('patched', listener)
      debouncedService.patch(1, { test: true })
    })

    it('updated', function (done) {
      store.commit('things/addItem', { id: 1, test: false })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      feathersSocketioClient.service('things').on('updated', item => {
        assert(
          store.state.things.keyedById[1].test,
          'the item received from the socket event was updated in the store'
        )
        done()
      })

      feathersSocketioClient.service('things').update(1, { test: true })
    })

    it('updated debounced', function (done) {
      const { debounceEventsTime } = store.state['things-debounced']

      store.commit('things-debounced/clearAll')
      store.commit('things-debounced/addItem', { id: 1, test: false })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const listener = item => {
        assert(
          !store.state['things-debounced'].keyedById[1].test,
          'the item is not updated immediately'
        )
        setTimeout(() => {
          assert(
            store.state['things-debounced'].keyedById[1].test,
            'the item received from the socket event was updated in the store'
          )
          done()
        }, debounceEventsTime * 2)
        debouncedService.off('updated', listener)
      }

      debouncedService.on('updated', listener)
      debouncedService.update(1, { test: true })
    })

    it('removed', function (done) {
      store.commit('things/addItem', { id: 1, test: false })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      feathersSocketioClient.service('things').on('removed', item => {
        assert(
          !store.state.things.keyedById[1],
          'the item received from the socket event was removed from the store'
        )
        done()
      })

      feathersSocketioClient.service('things').remove(1)
    })

    it('removed debounced', function (done) {
      const { debounceEventsTime } = store.state['things-debounced']

      store.commit('things-debounced/clearAll')
      store.commit('things-debounced/addItem', { id: 1, test: false })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const listener = item => {
        assert(
          store.state['things-debounced'].keyedById[1],
          'the item is not removed immediately'
        )

        setTimeout(() => {
          assert(
            !store.state.things.keyedById[1],
            'the item received from the socket event was removed from the store'
          )
          done()
        }, debounceEventsTime * 2)
        debouncedService.off('removed', listener)
      }

      debouncedService.on('removed', listener)
      debouncedService.remove(1)
    })

    it('debounce works with plenty items', function (done) {
      store.commit('things-debounced/clearAll')

      const { debounceEventsTime, debounceEventsMaxWait } = store.state[
        'things-debounced'
      ]

      const itemsCount = 100
      let i = 0

      assert(
        Object.keys(store.state['things-debounced'].keyedById).length === 0,
        'no items at start'
      )

      const now = performance.now()

      const setTimeoutCreate = () => {
        setTimeout(() => {
          debouncedService.create({ test: true, i })
          i++
          if (i < itemsCount) {
            if (performance.now() - now < debounceEventsMaxWait) {
              assert(
                Object.keys(store.state['things-debounced'].keyedById)
                  .length === 0,
                `no items at i: ${i}`
              )
            }
            setTimeoutCreate()
          } else {
            setTimeout(() => {
              assert(
                Object.keys(
                  store.state['things-debounced'].keyedById.length ===
                    itemsCount
                ),
                'all items are in store'
              )
              done()
            }, debounceEventsTime * 2)
          }
        }, debounceEventsTime / 4)
      }
      setTimeoutCreate()
    })

    it('debounced events get invoked during continuous events', function (done) {
      store.commit('things-debounced/clearAll')

      const { debounceEventsTime, debounceEventsMaxWait } = store.state[
        'things-debounced'
      ]

      assert(
        Object.keys(store.state['things-debounced'].keyedById).length === 0,
        'no items at start'
      )
      assert(debounceEventsMaxWait > 0, 'maxWait is set')

      const startedAt = performance.now()
      let i = 0

      const setTimeoutCreate = () => {
        setTimeout(() => {
          debouncedService.create({ test: true, i })
          i++
          const timePassed = Math.floor(
            performance.now() - startedAt - debounceEventsTime
          )
          if (timePassed <= debounceEventsMaxWait) {
            if (performance.now() - startedAt <= debounceEventsMaxWait) {
              assert(
                Object.keys(store.state['things-debounced'].keyedById)
                  .length === 0,
                `no items at i: ${i}, milliseconds passed: ${timePassed}`
              )
            }
            setTimeoutCreate()
          } else {
            assert(
              Object.keys(store.state['things-debounced'].keyedById).length ===
                i - 1,
              `items are inserted after maxWait`
            )
            done()
          }
        }, debounceEventsTime / 4)
      }
      setTimeoutCreate()
    })

    it('debounded remove after addOrUpdate also removes addOrUpdate queue and vise versa', function () {
      const { idField } = store.state['todos-debounced']

      assert(
        Object.keys(debouncedQueue.addOrUpdateById).length === 0,
        "'addOrUpdateById' initially empty"
      )

      assert(
        Object.keys(debouncedQueue.removeItemById).length === 0,
        "'removeItemById' initially empty"
      )

      debouncedQueue.enqueueAddOrUpdate({ [idField]: 1, test: true })

      assert(
        debouncedQueue.addOrUpdateById[1],
        "queued item for 'addOrUpdate' correctly"
      )

      debouncedQueue.enqueueRemoval({ [idField]: 1, test: false })

      assert(
        !debouncedQueue.addOrUpdateById[1],
        "queued item for 'addOrUpdate' removed immediately"
      )
      assert(
        debouncedQueue.removeItemById[1],
        'queued item for removal correctly'
      )

      debouncedQueue.enqueueAddOrUpdate({ [idField]: 1, test: true })

      assert(
        debouncedQueue.addOrUpdateById[1],
        "queued item for 'addOrUpdate' correctly again"
      )
      assert(
        !debouncedQueue.removeItemById[1],
        "queued item for 'remove' removed immediately"
      )
    })
  })
})
