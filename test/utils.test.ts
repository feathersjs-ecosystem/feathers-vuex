import { assert } from 'chai'
import { AuthState } from '../src/auth-module/types'
import { ServiceState } from './service-module/types'
import { isNode, isBrowser } from '../src/utils'
import { diff as deepDiff } from 'deep-object-diff'
import {
  initAuth,
  hydrateApi,
  getServicePrefix,
  getServiceCapitalization,
  getQueryInfo
} from '../src/utils'
import feathersVuex from '../src/index'
import { feathersSocketioClient as feathersClient } from './fixtures/feathers-client'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

interface RootState {
  auth: AuthState,
  users: ServiceState
}

describe('Utils', function() {
  before(function() {
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
  it('properly populates auth', function() {
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
      cookieName: 'feathers-jwt',
      feathersClient
    })
      .then(() => {
        assert(
          store.state.auth.accessToken === accessToken,
          'the token was in place'
        )
        assert(store.state.auth.payload, 'the payload was set')
        return feathersClient.authentication.getAccessToken()
      })
      .then(token => {
        assert.isDefined(token, 'the feathers client storage was set')
      })
  })

  it('properly hydrate SSR store', function() {
    const { makeServicePlugin, BaseModel, models } = feathersVuex(
      feathersClient,
      { serverAlias: 'hydrate' }
    )

    class User extends BaseModel {
      public static modelName = 'User'
      public static test: boolean = true
    }

    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: User,
          servicePath: 'users',
          service: feathersClient.service('users'),
          mutations: {
            addServerItem (state) {
              state.keyedById['abcdefg'] = { id: 'abcdefg', name: 'Guzz' }
            }
          }
        })
      ]
    })
    store.commit('users/addServerItem')
    assert(store.state.users.keyedById['abcdefg'], 'server document added')
    assert(store.state.users.keyedById['abcdefg'] instanceof Object, 'server document is pure javascript object')
    hydrateApi({ api: models.hydrate })
    assert(store.state.users.keyedById['abcdefg'] instanceof User, 'document hydrated')
  })

  describe('Inflections', function() {
    it('properly inflects the service prefix', function() {
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

describe('Pagination', function () {
  it('getQueryInfo', function () {
    const params = {
      qid: 'main-list',
      query: {
        test: true,
        $limit: 10,
        $skip: 0
      }
    }
    const response = {
      data: [],
      limit: 10,
      skip: 0,
      total: 500
    }
    const info = getQueryInfo(params, response)
    const expected = {
      isOutdated: undefined,
      qid: 'main-list',
      query: {
        test: true,
        $limit: 10,
        $skip: 0
      },
      queryId: '{"test":true}',
      queryParams: {
        test: true
      },
      pageParams: {
        $limit: 10,
        $skip: 0
      },
      pageId: '{"$limit":10,"$skip":0}',
      response: undefined
    }
    const diff = deepDiff(info, expected)

    assert.deepEqual(info, expected, 'query info formatted correctly')
  })

  it('getQueryInfo no limit or skip', function () {
    const params = {
      qid: 'main-list',
      query: {
        test: true
      }
    }
    const response = {
      data: [],
      limit: 10,
      skip: 0,
      total: 500
    }
    const info = getQueryInfo(params, response)
    const expected = {
      isOutdated: undefined,
      qid: 'main-list',
      query: {
        test: true
      },
      queryId: '{"test":true}',
      queryParams: {
        test: true
      },
      pageParams: {
        $limit: 10,
        $skip: 0
      },
      pageId: '{"$limit":10,"$skip":0}',
      response: undefined
    }
    const diff = deepDiff(info, expected)

    assert.deepEqual(info, expected, 'query info formatted correctly')
  })
})
