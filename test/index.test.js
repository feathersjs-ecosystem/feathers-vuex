import './service-module/service-module.test.js'
import './service-module/misconfigured-client.test.js'
import './service-module/actions.test.js'
import './service-module/getters.test.js'
import './service-module/mutations.test.js'
import './auth-module/auth-module.test.js'
import './auth-module/actions.test.js'
import './make-find-mixin.test.js'
import './utils.test.js'

import assert from 'chai/chai'
import 'steal-mocha'
import feathersVuex from '../src/index'
import { feathersSocketioClient as feathersClient } from './fixtures/feathers-client'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

describe('feathers-vuex', () => {
  it('is CommonJS compatible', () => {
    assert(typeof feathersVuex === 'function')
  })

  it('basic functionality', () => {
    assert(typeof feathersVuex === 'function', 'It worked')
  })

  it('requires a Feathers Client instance', () => {
    try {
      feathersVuex()
    } catch (error) {
      assert(error.message === 'You must provide a Feathers Client instance to feathers-vuex')
    }
  })

  it('includes the service and auth plugins', function () {
    const { service, auth, FeathersVuex, FeathersVuexFind, FeathersVuexGet } = feathersVuex(feathersClient)

    assert(typeof service === 'function', 'service util in place')
    assert(typeof auth === 'function', 'auth util in place')
    assert(typeof FeathersVuex.install === 'function', 'vue plugin is in place')
    assert(typeof FeathersVuexFind === 'object', 'FeathersVuexFind component is in place')
    assert(typeof FeathersVuexGet === 'object', 'FeathersVuexGet component is in place')
  })

  it('can globally set the options', () => {
    const options = {
      idField: '___idField',
      autoRemove: true
    }
    const { service } = feathersVuex(feathersClient, options)
    const store = new Vuex.Store({
      plugins: [
        service('todos')
      ]
    })
    const { idField, autoRemove } = store.state.todos
    assert(idField === options.idField, 'idField was set correctly')
    assert(autoRemove === options.autoRemove, 'autoRemove was set correctly')
  })
})
