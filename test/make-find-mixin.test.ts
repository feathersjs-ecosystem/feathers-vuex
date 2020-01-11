/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import jsdom from 'jsdom-global'
import Vue from 'vue/dist/vue'
import Vuex from 'vuex'
import feathersVuex, { FeathersVuex } from '../src/index'
import makeFindMixin from '../src/make-find-mixin'
import { feathersRestClient as feathersClient } from './fixtures/feathers-client'

jsdom()
require('events').EventEmitter.prototype._maxListeners = 100

function makeContext() {
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'make-find-mixin'
  })

  class FindModel extends BaseModel {
    public static modelName = 'FindModel'
    public static test = true
  }

  return { FindModel, BaseModel, makeServicePlugin }
}

Vue.use(Vuex)
Vue.use(FeathersVuex)

describe('Find Mixin', function() {
  const { makeServicePlugin, FindModel } = makeContext()
  const serviceName = 'todos'
  const store = new Vuex.Store({
    plugins: [
      makeServicePlugin({
        Model: FindModel,
        service: feathersClient.service(serviceName)
      })
    ]
  })

  it('correctly forms mixin data', function() {
    const todosMixin = makeFindMixin({ service: 'todos' })
    // todosMixin.
    interface TodosComponent {
      todos: []
      todosServiceName: string
      isFindTodosPending: boolean
      haveTodosBeenRequestedOnce: boolean
      haveTodosLoadedOnce: boolean
      findTodos: Function
      todosLocal: boolean
      todosQid: string
      todosQueryWhen: Function
      todosParams: any
      todosFetchParams: any
    }

    const vm = new Vue({
      name: 'todos-component',
      mixins: [todosMixin],
      store,
      template: `<div></div>`
    }).$mount()

    assert.deepEqual(vm.todos, [], 'todos prop was empty array')
    assert(
      vm.hasOwnProperty('todosPaginationData'),
      'pagination data prop was present, even if undefined'
    )
    assert(vm.todosServiceName === 'todos', 'service name was correct')
    assert(vm.isFindTodosPending === false, 'loading boolean is in place')
    assert(
      vm.haveTodosBeenRequestedOnce === false,
      'requested once boolean is in place'
    )
    assert(vm.haveTodosLoadedOnce === false, 'loaded once boolean is in place')
    assert(typeof vm.findTodos === 'function', 'the find action is in place')
    assert(vm.todosLocal === false, 'local boolean is false by default')
    assert(
      typeof vm.$options.created[0] === 'function',
      'created lifecycle hook function is in place given that local is false'
    )
    assert(
      vm.todosQid === 'default',
      'the default query identifier is in place'
    )
    assert(vm.todosQueryWhen === true, 'the default queryWhen is true')
    // assert(vm.todosWatch.length === 0, 'the default watch is an empty array')
    assert(
      vm.todosParams === undefined,
      'no params are in place by default, must be specified by the user'
    )
    assert(
      vm.todosFetchParams === undefined,
      'no fetch params are in place by default, must be specified by the user'
    )
  })

  it('correctly forms mixin data for dynamic service', function() {
    const tasksMixin = makeFindMixin({
      service() {
        return this.serviceName
      },
      local: true
    })

    interface TasksComponent {
      tasks: []
      serviceServiceName: string
      isFindTasksPending: boolean
      findTasks: Function
      tasksLocal: boolean
      tasksQid: string
      tasksQueryWhen: Function
      tasksParams: any
      tasksFetchParams: any
    }

    const vm = new Vue({
      name: 'tasks-component',
      data: () => ({
        serviceName: 'tasks'
      }),
      mixins: [tasksMixin],
      store,
      template: `<div></div>`
    }).$mount()

    assert.deepEqual(vm.items, [], 'items prop was empty array')
    assert(
      vm.hasOwnProperty('servicePaginationData'),
      'pagination data prop was present, even if undefined'
    )
    assert(vm.serviceServiceName === 'tasks', 'service name was correct')
    assert(vm.isFindServicePending === false, 'loading boolean is in place')
    assert(typeof vm.findService === 'function', 'the find action is in place')
    assert(vm.serviceLocal === true, 'local boolean is set to true')
    assert(
      typeof vm.$options.created === 'undefined',
      'created lifecycle hook function is NOT in place given that local is true'
    )
    assert(
      vm.serviceQid === 'default',
      'the default query identifier is in place'
    )
    assert(vm.serviceQueryWhen === true, 'the default queryWhen is true')
    // assert(vm.tasksWatch.length === 0, 'the default watch is an empty array')
    assert(
      vm.serviceParams === undefined,
      'no params are in place by default, must be specified by the user'
    )
    assert(
      vm.serviceFetchParams === undefined,
      'no fetch params are in place by default, must be specified by the user'
    )
  })
})
