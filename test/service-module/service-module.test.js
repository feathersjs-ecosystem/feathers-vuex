import assert from 'chai/chai'
import setupVuexService from '~/src/service-module/service-module'
import { makeFeathersRestClient, feathersRestClient as feathersClient, feathersSocketioClient } from '../fixtures/feathers-client'
import { stripSlashes } from '../../src/utils'
import memory from 'feathers-memory'
import { makeTodos } from '../fixtures/todos'
import Vuex from 'vuex'

const globalModels = {}
const service = setupVuexService(feathersClient, {}, globalModels)

describe('Service Module', () => {
  it('registers a vuex plugin and Model for the service', () => {
    const serviceName = 'todos'
    const feathersService = feathersClient.service(serviceName)
    const store = new Vuex.Store({
      plugins: [service(serviceName)]
    })
    assert(globalModels.hasOwnProperty('Todo'), 'the Model was added to the globalModels')
    assert(feathersService.FeathersVuexModel === globalModels.Todo, 'the Model is also found at service.FeathersVuexModel')

    const todo = new globalModels.Todo({
      description: 'Do the dishes',
      isComplete: false
    })
    assert(todo instanceof globalModels.Todo, 'Model can be instantiated.')

    assert(store.state[serviceName])
  })

  describe('Models', function () {
    beforeEach(function () {
      const serviceName = 'todos'
      const store = new Vuex.Store({
        plugins: [service(serviceName)]
      })
      assert(store)
      assert(globalModels.hasOwnProperty('Todo'), 'the Model was added to the globalModels')
      const owners = this.owners = [
        { id: 1, name: 'Marshall' },
        { id: 2, name: 'Mariah' },
        { id: 3, name: 'Leah' }
      ]
      const data = {
        id: 1,
        description: 'Do the dishes',
        isComplete: false,
        owners
      }
      store.commit('todos/addItem', data)

      const todo = store.state.todos.keyedById[1]

      this.todo = todo
      this.todoClone = todo.clone()
    })

    it('allows creating model clones', function () {
      const { todoClone } = this

      assert(todoClone.isClone, 'created a todo clone with isClone attribute')
      assert(todoClone instanceof globalModels.Todo, 'the copy is an instance of the same class')
    })

    it('allows modifying clones without affecting the original', function () {
      const { todo, todoClone } = this

      todoClone.description = 'Do something else'

      assert(todo.description === 'Do the dishes', 'the original todo remained intact')
    })

    it('allows commiting changes back to the original in the store', function () {
      const { todo, todoClone } = this

      todoClone.description = 'Do something else'
      todoClone.commit()

      assert(todo.description === 'Do something else', 'the original todo was updated')
    })

    it('performs a shallow merge when commiting back to the original record', function () {
      const { todo, todoClone, owners } = this

      todoClone.owners = [
        { id: 1, name: 'Marshall' },
        { id: 2, name: 'Mariah' }
      ]
      assert.deepEqual(todo.owners, owners, 'original todo remained unchanged')

      todoClone.commit()

      assert.deepEqual(todo.owners, [ owners[0], owners[1] ], 'ownerIds were updated properly')
    })

    it(`changes the original record if you don't use the return value of commit()`, function () {
      const { todo, todoClone, owners } = this

      assert.deepEqual(todo.owners, owners, 'original todo remained unchanged')

      todoClone.commit()
      todoClone.owners[0].name = 'Ted'

      assert.deepEqual(todo.owners[0].name, 'Ted', 'nested object in original todo was changed')
    })

    it(`doesn't change the original record if you use modify return value of a commit`, function () {
      let { todo, todoClone, owners } = this

      assert.deepEqual(todo.owners, owners, 'original todo remained unchanged')

      todoClone = todoClone.commit()
      todoClone.owners[0].name = 'Ted'

      assert.deepEqual(todo.owners[0].name, 'Marshall', 'nested object in original todo was NOT changed')
    })

    it('allows reseting copy changes back to match the original', function () {
      const { todo, todoClone } = this

      todoClone.description = 'Do something else'
      todoClone.reset()

      assert(todo.description === 'Do the dishes', 'the original todo was untouched')
      assert(todoClone.description === 'Do the dishes', 'the clone was reset to match the original')
    })

    it('adds additional properties to model instances when more data arrives for the same id', function () {
      const { todo, owners } = this
      const newData = {
        id: 1,
        description: 'Do the dishes',
        isComplete: false,
        owners,
        test: true
      }
      const newTodo = new todo.constructor(newData)

      assert(newTodo === todo, 'the records are the same')
      assert(newTodo.test === true, 'the new attribute was added')
      assert(todo.test === true, 'the new attribute was also added to the original')
    })

    it('ignores when new data with matching id has fewer props than current record', function () {
      const { todo, owners } = this
      const newData = {
        id: 1,
        owners
      }
      const newTodo = new todo.constructor(newData)

      assert(newTodo === todo, 'the records are the same')
      assert(todo.description === 'Do the dishes', 'the existing attributes remained in place')
      assert(todo.isComplete === false, 'the existing attributes remained in place')
    })

    it('updates the new record when non-null, non-undefined values do not match', function () {
      const { todo, owners } = this
      const newData = {
        id: 1,
        description: 'Do the mopping',
        isComplete: true,
        owners
      }
      const newTodo = new todo.constructor(newData)

      assert(newTodo === todo, 'the records are the same')
      assert(todo.description === 'Do the mopping', 'non-matching string was updated')
      assert(todo.isComplete === true, 'non-matching boolean was updated')
    })
  })

  describe('Models - Default Values', function () {
    beforeEach(function () {
      const taskDefaults = this.taskDefaults = {
        id: null,
        description: '',
        isComplete: false
      }
      this.store = new Vuex.Store({
        plugins: [
          service('todos'),
          service('people', {
            instanceDefaults: {
              firstName: '',
              lastName: '',
              location: {
                coordinates: [ -111.549668, 39.014 ]
              },
              get fullName () {
                return `${this.firstName} ${this.lastName}`
              },
              todos ({ store }) {
                console.log(Object.keys(store))
              }
            }
          }),
          service('tasks', {
            keepCopiesInStore: true,
            instanceDefaults: taskDefaults
          }),
          service('groups', {
            instanceDefaults (data, { store, Model, Models }) {
              return {
                name: '',
                get todos () {
                  return Models.Todo.findInStore({ query: {} }).data
                }
              }
            }
          })
        ]
      })
      this.Todo = globalModels.Todo
      this.Task = globalModels.Task
      this.Person = globalModels.Person
      this.Group = globalModels.Group
    })

    // store.commit('todos/addItem', data)

    it('models default to an empty object', function () {
      const { Todo } = this
      const todo = new Todo()

      assert.deepEqual(todo, {}, 'default model is an empty object')
    })

    it('setCurrent works on model instances with getters', function () {
      const { Person, store } = this
      const person = new Person({
        id: 1,
        firstName: 'Al',
        lastName: 'fred'
      })
      store.commit('people/setCurrent', person)

      assert(store.state.people.copy.fullName === 'Al fred', 'setCurrent preserved the getter accessor prop')
    })

    it('stores clones in Model.copiesById by default', function () {
      const { Todo } = this
      const todo = new Todo({ id: 1, description: 'Do something' })

      assert.deepEqual(Todo.copiesById, {}, 'Model.copiesById should start out empty')

      const todoClone = todo.clone()
      assert(Todo.copiesById[1], 'should have a copy stored on Model.copiesById')

      todoClone.description = 'Do something else'
      todoClone.commit()

      assert.equal(todo.description, 'Do something else', 'the original should have been updated')
    })

    it('allows customizing the default values for a model', function () {
      const { Task, taskDefaults } = this
      const task = new Task()

      assert.deepEqual(task, taskDefaults, 'the instance had the customized values')
    })

    it('allows model classes to be customized with es5 getters', function () {
      const { Person } = this
      const person = new Person({
        firstName: 'Marshall',
        lastName: 'Thompson'
      })

      assert.equal(person.fullName, `Marshall Thompson`, 'the es5 getter returned the correct value')
    })

    it('instanceDefaults can be a function that receives the store', function () {
      const { Group } = this
      const group = new Group({
        name: 'test'
      })

      assert(Array.isArray(group.todos), 'instanceDefaults correctly assigned as function')
    })

    it('does not allow sharing of deeply nested objects between instances', function () {
      const { Person } = this
      const person1 = new Person({ firstName: 'Marshall', lastName: 'Thompson' })
      const person2 = new Person({ firstName: 'Austin', lastName: 'Thompson' })

      person1.location.coordinates[0] = 5

      assert.equal(person2.location.coordinates[0], -111.549668, 'the value was not shared')
    })

    it('keeps the options on the Model', function () {
      const { Task, taskDefaults } = this
      const options = {
        actions: {},
        apiPrefix: '',
        autoRemove: false,
        debug: false,
        enableEvents: true,
        addOnUpsert: false,
        diffOnPatch: false,
        skipRequestIfExists: false,
        getters: {},
        globalModels,
        idField: 'id',
        instanceDefaults: taskDefaults,
        keepCopiesInStore: true,
        modelName: '',
        mutations: {},
        nameStyle: 'short',
        preferUpdate: false,
        replaceItems: false,
        paramsForServer: [],
        whitelist: [],
        state: {}
      }

      assert.deepEqual(Task.options, options, 'The Model.options object should be in place')
    })
  })

  describe('Models - Methods', function () {
    beforeEach(function () {
      this.store = new Vuex.Store({
        strict: true,
        plugins: [
          service('tasks', {
            preferUpdate: true
          }),
          service('todos'),
          service('items')
        ]
      })
      this.Todo = globalModels.Todo
      this.Task = globalModels.Task
    })

    it('Model.find', function () {
      const { Todo } = this

      assert(typeof Todo.find === 'function')
    })

    it('Model.findInStore', function () {
      const { Todo } = this

      assert(typeof Todo.findInStore === 'function')
    })

    it('Model.get', function () {
      const { Todo } = this

      assert(typeof Todo.get === 'function')
    })

    it('Model.getFromStore', function () {
      const { Todo } = this

      assert(typeof Todo.getFromStore === 'function')
    })

    it('instance.save calls create with correct arguments', function () {
      const { Todo } = this
      const todo = new Todo({ test: true })

      Object.defineProperty(todo, 'create', {
        value (params) {
          assert(arguments.length === 1, 'should have only called with params')
          assert(params === undefined, 'no params should have been passed this time')
        }
      })

      todo.save()
    })

    it('instance.save passes params to create', function () {
      const { Todo } = this
      const todo = new Todo({ test: true })
      let called = false

      Object.defineProperty(todo, 'create', {
        value (params) {
          assert(arguments.length === 1, 'should have only called with params')
          assert(params.test, 'should have received params')
          called = true
        }
      })

      todo.save({ test: true })
      assert(called, 'create should have been called')
    })

    it('instance.save passes params to patch', function () {
      const { Todo } = this
      const todo = new Todo({ id: 1, test: true })
      let called = false

      Object.defineProperty(todo, 'patch', {
        value (params) {
          assert(arguments.length === 1, 'should have only called with params')
          assert(params.test, 'should have received params')
          called = true
        }
      })

      todo.save({ test: true })
      assert(called, 'patch should have been called')
    })

    it('instance.save passes params to update', function () {
      const { Task } = this
      const task = new Task({ id: 1, test: true })
      let called = false

      Object.defineProperty(task, 'update', {
        value (params) {
          assert(arguments.length === 1, 'should have only called with params')
          assert(params.test, 'should have received params')
          called = true
        }
      })

      task.save({ test: true })
      assert(called, 'update should have been called')
    })

    it('instance.toJSON', function () {
      const { Task } = this
      const task = new Task({ id: 1, test: true })

      Object.defineProperty(task, 'getter', {
        get () {
          return `got'er`
        }
      })

      assert.equal(task.getter, `got'er`)

      const json = task.toJSON()

      assert(json, 'got json')
    })
  })

  describe('Models - modelName', function () {
    beforeEach(function () {
      this.store = new Vuex.Store({
        strict: true,
        plugins: [
          service('media'),
          service('hotspot-media', {
            modelName: 'HotspotMedia'
          })
        ]
      })
      this.Medium = globalModels.Medium
      this.HotspotMedia = globalModels.HotspotMedia
    })

    it('allows passing a custom Model name', function () {
      assert(!this.HotspotMedium, `the model wasn't in the default location`)
      assert(this.HotspotMedia, 'the model is named correctly.')
    })
  })

  describe('Models - Dates', function () {
    beforeEach(function () {
      this.store = new Vuex.Store({
        strict: true,
        plugins: [
          service('todos', {
            instanceDefaults: {
              id: null,
              description: '',
              isComplete: false,
              createdAt: Date
            }
          })
        ]
      })
      this.Todo = globalModels.Todo
    })

    it('converts keys that contain the Date constructor into date instances', function () {
      const { Todo } = this
      const createdAt = '2018-05-01T04:42:24.136Z'
      const todo = new Todo({
        description: 'Go on a date.',
        isComplete: true,
        createdAt
      })

      assert(typeof todo.createdAt === 'object', 'todo.createdAt is an instance of object')
      assert(todo.createdAt.constructor.name === 'Date', 'todo.createdAt is an instance of date')
      assert(todo.createdAt.toString() === new Date(createdAt).toString(), 'the correct date was used')
    })
  })

  describe('Models - Relationships', function () {
    beforeEach(function () {
      this.store = new Vuex.Store({
        strict: true,
        plugins: [
          service('tasks', {
            instanceDefaults: {
              id: null,
              description: '',
              isComplete: false
            }
          }),
          service('todos', {
            instanceDefaults (data) {
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
          }),
          service('items', {
            instanceDefaults (data, { store, Model, Models }) {
              return {
                test: false,
                todo: 'Todo',
                get todos () {
                  return Models.Todo.findInStore({ query: {} }).data
                }
              }
            },
            mutations: {
              toggleTestBoolean (state, item) {
                item.test = !item.test
              }
            }
          })
        ]
      })
      this.Todo = globalModels.Todo
      this.Task = globalModels.Task
      this.Item = globalModels.Item
    })

    it('can setup relationships through es5 getters in instanceDefaults', function () {
      const { Item, Todo } = this
      const todo = new Todo({ id: 5, description: 'hey' })
      const item = new Item({})

      assert(Array.isArray(item.todos), 'Received an array of todos')
      assert(item.todos[0] === todo, 'The todo was returned through the getter')
    })

    it('can have different instanceDefaults based on new instance data', function () {
      const { Todo } = this
      const normalTodo = new Todo({
        description: 'Normal'
      })
      const highPriorityTodo = new Todo({
        description: 'High Priority',
        priority: 'high'
      })

      assert(!normalTodo.hasOwnProperty('isHighPriority'), 'Normal todos do not have an isHighPriority default attribute')
      assert(highPriorityTodo.isHighPriority, 'High priority todos have a unique attribute')
    })

    it('converts keys that match Model names into Model instances', function () {
      const { Todo, store } = this
      const todo = new Todo({
        task: {
          description: 'test',
          isComplete: true
        }
      })

      assert(todo.task.constructor.className === 'Task', 'task is an instance of Task')
      assert.deepEqual(store.state.tasks.keyedById, {}, 'nothing was added to the store')
    })

    it('adds model instances containing an id to the store', function () {
      const { Todo, store } = this

      const todo = new Todo({
        task: {
          id: 1,
          description: 'test',
          isComplete: true
        }
      })

      assert.deepEqual(store.state.tasks.keyedById[1], todo.task, 'task was added to the store')
    })

    it('works with multiple keys that match Model names', function () {
      const { Todo, store } = this

      const todo = new Todo({
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

      assert.deepEqual(store.state.tasks.keyedById[1], todo.task, 'task was added to the store')
      assert.deepEqual(store.state.items.keyedById[2], todo.item, 'item was added to the store')
    })

    it('handles nested relationships', function () {
      const { Todo } = this

      const todo = new Todo({
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

      assert(todo.item.todo.constructor.className === 'Todo', 'the nested todo is an instance of Todo')
    })

    it('handles recursive nested relationships', function () {
      const { Todo, store } = this

      const todo = new Todo({
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

      assert.deepEqual(store.state.todos.keyedById[1], todo, 'todo was added to the store')
      assert.deepEqual(store.state.items.keyedById[2], todo.item, 'item was added to the store')
      assert(todo.item, 'todo still has an item')
      assert(todo.item.todo, 'todo still nested in itself')
    })

    it('updates related data', function () {
      const { Todo, store } = this

      const todo = new Todo({
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
      // todo.item.test = false

      assert.equal(todo.item.test, false, 'the nested todo.item.test should be false')
      assert.equal(storedTodo.item.test, false, 'the nested item.test should be false')
      assert.equal(storedItem.test, false, 'item.test should be false')
    })

    it(`allows creating more than once relational instance`, function () {
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

      assert.equal(todo1.item.test, true, 'the nested todo.item.test should be true')
      assert.equal(todo2.item.test, true, 'the nested todo.item.test should be true')
      assert.equal(storedTodo.item.test, true, 'the nested item.test should be true')
      assert.equal(storedItem.test, true, 'item.test should be true')
    })

    it(`handles arrays of related data`, function () {
      const { Todo, store } = this

      const todo1 = new Todo({
        id: 'todo-1',
        description: 'todo description',
        item: [
          {
            id: 'item-1',
            test: true
          }, {
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
          }, {
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
    it('service stores have global defaults', () => {
      const store = new Vuex.Store({
        plugins: [
          service('tasks'),
          service('/v2/todos')
        ]
      })
      const { state } = store

      assert(state.tasks.idField === 'id', 'default idField is `id`')
      assert(state.tasks.autoRemove === false, 'autoRemove is off by default')
      assert(state.todos, 'uses `short` nameStyle by default')
    })

    it('can customize the idField for each service', function () {
      const idField = '_id'
      const store = new Vuex.Store({
        plugins: [
          service('tests', { idField })
        ]
      })

      assert(store.state.tests.idField === idField, 'the idField was properly set')
    })

    it('allows enabling autoRemove', function () {
      const autoRemove = true
      const store = new Vuex.Store({
        plugins: [
          service('tests', { autoRemove })
        ]
      })

      assert(store.state.tests.autoRemove === autoRemove, 'the autoRemove was enabled')
    })

    it('can switch to path name as namespace', () => {
      const nameStyle = 'path'
      const serviceName = '/v1/tests'
      const store = new Vuex.Store({
        plugins: [
          service(serviceName, { nameStyle })
        ]
      })
      const namespace = stripSlashes(serviceName)

      assert(store.state[namespace], 'the full path name was used as a namespace')
    })

    it('can explicitly provide a namespace', () => {
      const namespace = 'blah'
      const store = new Vuex.Store({
        plugins: [
          service('/v1/tests', { namespace })
        ]
      })
      assert(store.state.blah, 'the namespace option was used as the namespace')
    })

    it('prioritizes the explicit namespace', () => {
      const namespace = 'blah'
      const nameStyle = 'path'
      const store = new Vuex.Store({
        plugins: [
          service('/v1/tests', { namespace, nameStyle })
        ]
      })
      assert(store.state.blah, 'the namespace option was used as the namespace')
    })
  })

  describe('Basics', () => {
    beforeEach(function () {
      this.feathersClient = makeFeathersRestClient()
      this.feathersClient.use('todos', memory({ store: makeTodos() }))
      this.service = setupVuexService(this.feathersClient)
    })

    it('populates default store', () => {
      const store = new Vuex.Store({
        plugins: [
          service('todos')
        ]
      })
      const todoState = store.state.todos
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
        setCurrentOnGet: true,
        setCurrentOnCreate: true,
        skipRequestIfExists: false,
        preferUpdate: false,
        replaceItems: false,
        servicePath: 'todos',
        pagination: {},
        paramsForServer: [],
        whitelist: []
      }

      assert.deepEqual(todoState, expectedState, 'the expected state was returned')
    })

    it('throws an error if first arg is not a string', function () {
      const { service } = this
      try {
        new Vuex.Store({ // eslint-disable-line no-new
          plugins: [
            service({})
          ]
        })
      } catch (error) {
        assert(error.message === 'The first argument to setup a feathers-vuex service must be a string', 'threw an error')
      }
    })

    it(`populates items on find`, function (done) {
      const store = new Vuex.Store({
        plugins: [
          this.service('todos', { idField: '_id' })
        ]
      })

      const todoState = store.state.todos

      assert(todoState.ids.length === 0)

      store.dispatch('todos/find', { query: {} })
        .then(todos => {
          assert(todoState.ids.length === 3)
          done()
        })
        .catch(error => {
          assert(!error, error.message)
          done()
        })
    })

    describe('Auto-remove items', function () {
      beforeEach(function () {
        this.feathersClient = makeFeathersRestClient()
        this.feathersClient.use('todos', memory({
          store: makeTodos()
        }))
        this.feathersClient.use('tasks', memory({
          store: makeTodos(),
          paginate: {
            default: 10,
            max: 50
          }
        }))
        this.service = setupVuexService(this.feathersClient)
      })

      it(`removes missing items when pagination is off`, function (done) {
        const store = new Vuex.Store({
          plugins: [
            this.service('todos', { idField: '_id', autoRemove: true })
          ]
        })

        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store.dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('todos').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(todoState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(todoState.ids.length === 2, 'there are now two items in the store')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when pagination is on`, function (done) {
        const store = new Vuex.Store({
          plugins: [
            this.service('tasks', { idField: '_id', autoRemove: true })
          ]
        })

        const taskState = store.state.tasks

        assert(taskState.ids.length === 0)

        // Load some data into the store
        store.dispatch('tasks/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('tasks').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(taskState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('tasks/find', { query: {} })
          })
          .then(todos => {
            assert(todos.hasOwnProperty('total'), 'pagination is on')
            assert(taskState.ids.length === 3, 'there are still three items in the store')
            done()
          })
          .catch(error => {
            assert(!error, error.message)
            done()
          })
      })

      it(`does not remove missing items when autoRemove is off`, function (done) {
        const store = new Vuex.Store({
          plugins: [
            this.service('todos', { idField: '_id', autoRemove: false })
          ]
        })
        const todoState = store.state.todos

        assert(todoState.ids.length === 0)

        // Load some data into the store
        store.dispatch('todos/find', { query: {} })
          .then(todos => {
            // Remove the third item from the service
            delete this.feathersClient.service('todos').store[3]
            // We went around using the store actions, so there will still be three items.
            assert(todoState.ids.length === 3, 'there are still three items in the store')

            // Perform the same query again
            return store.dispatch('todos/find', { query: {} })
          })
          .then(todos => {
            assert(todoState.ids.length === 3, 'there are still three items in the store')
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
      const customState = {
        test: true,
        test2: {
          test: true
        }
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', { state: customState })
        ]
      })

      assert(store.state.todos.test === true, 'added custom state')
      assert(store.state.todos.test2.test === true, 'added custom state')
    })

    it('allows custom mutations', function () {
      const state = { test: true }
      const customMutations = {
        setTestToFalse (state) {
          state.test = false
        }
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', { state, mutations: customMutations })
        ]
      })

      store.commit('todos/setTestToFalse')
      assert(store.state.todos.test === false, 'the custom state was modified by the custom mutation')
    })

    it('allows custom getters', function () {
      const customGetters = {
        oneTwoThree (state) {
          return 123
        }
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', { getters: customGetters })
        ]
      })

      assert(store.getters['todos/oneTwoThree'] === 123, 'the custom getter was available')
    })

    it('allows adding custom actions', function () {
      const config = {
        state: {
          isTrue: false
        },
        mutations: {
          setToTrue (state) {
            state.isTrue = true
          }
        },
        actions: {
          trigger (context) {
            context.commit('setToTrue')
          }
        }
      }
      const store = new Vuex.Store({
        plugins: [
          service('todos', config)
        ]
      })

      store.dispatch('todos/trigger')
      assert(store.state.todos.isTrue === true, 'the custom action was run')
    })
  })

  describe.skip('Updates the Store on Events', function () {
    const socketService = setupVuexService(feathersSocketioClient)

    it('created', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      feathersSocketioClient.service('things').on('created', item => {
        assert(store.state.things.keyedById[0].test, 'the item received from the socket event was added to the store')
        done()
      })

      feathersSocketioClient.service('things').create({ test: true })
    })

    it('patched', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('patched', item => {
        assert(store.state.things.keyedById[1].test, 'the item received from the socket event was updated in the store')
        done()
      })

      feathersSocketioClient.service('things').patch(1, { test: true })
    })

    it('updated', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('updated', item => {
        assert(store.state.things.keyedById[1].test, 'the item received from the socket event was updated in the store')
        done()
      })

      feathersSocketioClient.service('things').update(1, { test: true })
    })

    it('removed', function (done) {
      const store = new Vuex.Store({
        plugins: [
          socketService('things')
        ]
      })

      store.commit('things/addItem', { id: 1, test: false })

      feathersSocketioClient.service('things').on('removed', item => {
        assert(!store.state.things.keyedById[1], 'the item received from the socket event was removed from the store')
        done()
      })

      feathersSocketioClient.service('things').remove(1)
    })
  })
})
