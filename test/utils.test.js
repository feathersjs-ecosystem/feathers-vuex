import assert from 'chai/chai'
import { initAuth, getServicePrefix, getServiceCapitalization } from '../src/utils'
import feathersNuxt from '../src/index'
import { feathersSocketioClient as feathersClient } from './fixtures/feathers-client'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const { service, auth } = feathersNuxt(feathersClient)

describe('Utils', function () {
  it('properly populates auth', function () {
    const store = new Vuex.Store({
      plugins: [
        service('todos'),
        auth()
      ]
    })
    const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoiOTk5OTk5OTk5OTkiLCJuYW1lIjoiSm9obiBEb2UiLCJhZG1pbiI6dHJ1ZX0.lUlEd3xH-TnlNRbKM3jnDVTNoIg10zgzaS6QyFZE-6g'
    const req = {
      headers: {
        cookie: 'feathers-jwt=' + accessToken
      }
    }
    return initAuth({
      commit: store.commit,
      req,
      moduleName: 'auth',
      cookieName: 'feathers-jwt'
    })
      .then(payload => {
        assert(store.state.auth.accessToken === accessToken, 'the token was in place')
        assert(store.state.auth.payload, 'the payload was set')
        return feathersClient.passport.getJWT()
      })
      .then((token) => {
        assert.isDefined(token, 'the feathers client storage was set')
      })
  })

  describe('Inflections', function () {
    it('properly inflects the service prefix', function () {
      const decisionTable = [
        ['todos', 'todos'],
        ['TODOS', 'tODOS'],
        ['environment-Panos', 'environmentPanos'],
        ['env-panos', 'envPanos'],
        ['envPanos', 'envPanos'],
        ['api/v1/env-panos', 'envPanos']
      ]
      decisionTable.forEach(([ path, prefix ]) => {
        assert(getServicePrefix(path) === prefix, `The service prefix for path "${path}" was "${getServicePrefix(path)}", expected "${prefix}"`)
      })
    })

    it('properly inflects the service capitalization', function () {
      const decisionTable = [
        ['todos', 'Todos'],
        ['TODOS', 'TODOS'],
        ['environment-Panos', 'EnvironmentPanos'],
        ['env-panos', 'EnvPanos'],
        ['envPanos', 'EnvPanos'],
        ['api/v1/env-panos', 'EnvPanos']
      ]
      decisionTable.forEach(([ path, prefix ]) => {
        assert(getServiceCapitalization(path) === prefix, `The service prefix for path "${path}" was "${getServiceCapitalization(path)}", expected "${prefix}"`)
      })
    })
  })
})
