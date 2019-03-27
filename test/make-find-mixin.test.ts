import jsdom from 'jsdom-global'
import { assert } from 'chai'
import feathersVuex, { FeathersVuex, models } from '../src/index'
import { feathersRestClient as feathersClient } from './fixtures/feathers-client'
import makeFindMixin from '../src/make-find-mixin'
import Vue from 'vue/dist/vue'
import Vuex from 'vuex'

jsdom()

const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'make-find-mixin'
})

class FindModel extends BaseModel {
  public static test: boolean = true
}

Vue.use(Vuex)
Vue.use(FeathersVuex)

describe('Find Mixin', function() {
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
    assert(typeof vm.findTodos === 'function', 'the find action is in place')
    assert(vm.todosLocal === false, 'local boolean is false by default')
    assert(
      vm.todosQid === 'default',
      'the default query identifier is in place'
    )
    assert(vm.todosQueryWhen() === true, 'the default queryWhen is true')
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
})
