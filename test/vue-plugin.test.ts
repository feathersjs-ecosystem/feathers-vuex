import { assert } from 'chai'
import feathersVuex, { FeathersVuex } from '../src/index'
import { feathersRestClient as feathersClient } from './fixtures/feathers-client'
import Vue from 'vue/dist/vue'
import Vuex from 'vuex'

Vue.use(Vuex)
Vue.use(FeathersVuex)

const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'make-find-mixin'
})
class FindModel extends BaseModel {
  public static test: boolean = true
}

const serviceName = 'todos'
const store = new Vuex.Store({
  plugins: [
    makeServicePlugin({
      Model: FindModel,
      service: feathersClient.service(serviceName)
    })
  ]
})

interface VueWithFeathers {
  $FeathersVuex: {}
}

describe('Vue Plugin', function() {
  it('Adds the `$FeathersVuex` object to components', function() {
    const vm = new Vue<VueWithFeathers>({
      name: 'todos-component',
      store,
      template: `<div></div>`
    }).$mount()

    assert(vm.$FeathersVuex, 'registeredPlugin correctly')
  })
})
