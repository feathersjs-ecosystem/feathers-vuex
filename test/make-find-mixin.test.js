import assert from 'chai/chai'
import setupVuexService from '~/src/service-module/service-module'
import setupVuePlugin from '../src/vue-plugin/vue-plugin.js'
import { feathersRestClient as feathersClient } from './fixtures/feathers-client'
import makeFindMixin from '../src/make-find-mixin'
import Vue from 'vue/dist/vue'
import Vuex from 'vuex'

const globalModels = {}
const vuePlugin = setupVuePlugin(globalModels)
const service = setupVuexService(feathersClient, {}, globalModels)

Vue.use(Vuex)
Vue.use(vuePlugin)

describe('Find Mixin', function () {
  const serviceName = 'todos'
  const store = new Vuex.Store({
    plugins: [service(serviceName)]
  })

  it('correctly forms mixin data', function () {
    const todosMixin = makeFindMixin({ service: 'todos' })

    const vm = new Vue({
      name: 'todos-component',
      mixins: [
        todosMixin
      ],
      store,
      template: `<div></div>`
    }).$mount()

    assert.deepEqual(vm.todos, [], 'todos prop was empty array')
    assert(vm.hasOwnProperty('todosPaginationData'), 'pagination data prop was present, even if undefined')
    assert(vm.todosServiceName === 'todos', 'service name was correct')
    assert(vm.isFindTodosPending === false, 'loading boolean is in place')
    assert(typeof vm.findTodos === 'function', 'the find action is in place')
    assert(vm.todosLocal === false, 'local boolean is false by default')
    assert(vm.todosQid === 'default', 'the default query identifier is in place')
    assert(vm.todosQueryWhen() === true, 'the default queryWhen is true')
    // assert(vm.todosWatch.length === 0, 'the default watch is an empty array')
    assert(vm.todosParams === undefined, 'no params are in place by default, must be specified by the user')
    assert(vm.todosFetchParams === undefined, 'no fetch params are in place by default, must be specified by the user')
  })

  it('registers a vuex plugin and Model for the service', () => {
    assert(globalModels.hasOwnProperty('Todo'), 'the Model was added to the globalModels')

    const todo = new globalModels.Todo({
      description: 'Do the dishes',
      isComplete: false
    })
    assert(todo instanceof globalModels.Todo, 'Model can be instantiated.')

    assert(store.state[serviceName])
  })
})
