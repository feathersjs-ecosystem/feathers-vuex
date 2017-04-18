import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import feathers from 'feathers/client'
import hooks from 'feathers-hooks'
import auth from 'feathers-authentication-client'

const feathersClient = feathers()
  .configure(hooks())
  .configure(auth())

describe('Service Module - Bad Client Setup', () => {
  it('throws an error when no client transport plugin is registered', () => {
    const store = makeStore()
    feathersClient.configure(feathersVuex(store, {idField: '_id'}))

    try {
      feathersClient.service('todos')
    } catch (error) {
      assert(error, 'got an error with a misconfigured client')
    }
  })
})
