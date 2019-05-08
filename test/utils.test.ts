import { assert } from 'chai'
import { AuthState } from '../src/auth-module/types'
import { isNode, isBrowser } from '../src/utils'
import {
  initAuth,
  getServicePrefix,
  getServiceCapitalization
} from '../src/utils'
import feathersVuex from '../src/index'
import { feathersSocketioClient as feathersClient } from './fixtures/feathers-client'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

interface RootState {
  auth: AuthState
}

describe('Utils', function () {
  before(function () {
    const { makeServicePlugin, makeAuthPlugin, BaseModel } = feathersVuex(
      feathersClient,
      { serverAlias: 'utils' }
    )

    class User extends BaseModel {
      public static modelName = 'User'
      public static test: boolean = true
    }

    Object.assign(this, {
      makeServicePlugin,
      makeAuthPlugin,
      BaseModel,
      User
    })
  })
  it('properly populates auth', function () {
    const store = new Vuex.Store<RootState>({
      plugins: [
        this.makeServicePlugin({
          Model: this.User,
          servicePath: 'users',
          service: feathersClient.service('users')
        }),
        this.makeAuthPlugin({})
      ]
    })
    const accessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoiOTk5OTk5OTk5OTkiLCJuYW1lIjoiSm9obiBEb2UiLCJhZG1pbiI6dHJ1ZX0.lUlEd3xH-TnlNRbKM3jnDVTNoIg10zgzaS6QyFZE-6g'
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
      .then(() => {
        assert(
          store.state.auth.accessToken === accessToken,
          'the token was in place'
        )
        assert(store.state.auth.payload, 'the payload was set')
        // @ts-ignore
        return feathersClient.passport.getJWT()
      })
      .then(token => {
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
      decisionTable.forEach(([path, prefix]) => {
        assert(
          getServicePrefix(path) === prefix,
          `The service prefix for path "${path}" was "${getServicePrefix(
            path
          )}", expected "${prefix}"`
        )
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
      decisionTable.forEach(([path, prefix]) => {
        assert(
          getServiceCapitalization(path) === prefix,
          `The service prefix for path "${path}" was "${getServiceCapitalization(
            path
          )}", expected "${prefix}"`
        )
      })
    })
  })

  describe('Environments', () => {
    it('sets isNode to true', () => {
      assert(isNode, 'isNode was true')
    })

    it('sets isBrowser to false', () => {
      assert(!isBrowser, 'isBrowser was false')
    })
  })
})
