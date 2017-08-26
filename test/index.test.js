import './service-module/service-module.test.js'
import './service-module/misconfigured-client.test.js'
import './service-module/actions.test.js'
import './service-module/getters.test.js'
import './service-module/mutations.test.js'
import './auth-module/auth-module.test.js'
import './auth-module/actions.test.js'

import assert from 'chai/chai'
import 'steal-mocha'
import feathersVuex from '../src/index'
import { feathersSocketioClient as feathersClient } from './fixtures/feathers-client'
import vue from 'vue'
import Vuex from 'vuex'

vue.use(Vuex)

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
    const { service, auth } = feathersVuex(feathersClient)
    assert(typeof service === 'function', 'service util in place')
    assert(typeof auth === 'function', 'auth util in place')
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
