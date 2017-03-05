import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'

describe('Service Module', () => {
  it('Creating a service adds its module to the store', () => {
    const store = makeStore()
    makeFeathersRestClient()
      .configure(feathersVuex(store))
      .service('todos')
    assert(store.state.todos)
  })

  it('populates default todos data', () => {
    const store = makeStore()
    makeFeathersRestClient()
      .configure(feathersVuex(store, {idField: '_id'}))
      .service('todos')

    const todoState = store.state.todos

    assert(todoState.ids.length === 0)
    assert(todoState.isPending === false)
    assert(todoState.isError === false)
    assert(todoState.error === undefined)
    assert(todoState.idField === '_id')
    assert.deepEqual(todoState.keyedById, {})
  })
})
