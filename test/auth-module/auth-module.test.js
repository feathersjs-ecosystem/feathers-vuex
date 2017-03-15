import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'

describe('Auth Module', () => {
  describe('Configuration', () => {
    it('has default auth namespace', () => {
      const store = makeStore()
      const feathersClient = makeFeathersRestClient()
        .configure(feathersVuex(store))
      const service = feathersClient.service('todos')
      assert(service.vuexOptions.global.auth)
    })
  })

  // describe('Basics', () => {

  // })
})
