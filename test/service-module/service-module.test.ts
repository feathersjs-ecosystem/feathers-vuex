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
    public static modelName = 'Task'
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

function makeContextWithState() {
  const feathers = makeFeathersRestClient()
  const service = feathers.use('service-todos', memory({ store: makeTodos() }))
  const { makeServicePlugin, BaseModel } = feathersVuex(feathers, {
    serverAlias: 'basics'
  })
  class ServiceTodo extends BaseModel {
    public static test: boolean = true
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
    public static servicePath: string = 'todos'
    public static test: boolean = true
  }
  class Task extends BaseModel {
    public static modelName = 'Task'
    public static servicePath: string = 'tasks'
    public static test: boolean = true
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
      // @ts-ignore
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

    it(`no longer changes original if you don't use the return value of commit()`, function () {
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

    it('allows reseting copy changes back to match the original', function () {
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
        diffOnPatch: true,
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

  describe.skip('Updates the Store on Events', function () {
    const fv = feathersVuex(feathersSocketioClient, {
      serverAlias: 'updates-store-on-events'
    })

    it('created', function (done) {
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

    it('patched', function (done) {
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

    it('updated', function (done) {
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

    it('removed', function (done) {
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
