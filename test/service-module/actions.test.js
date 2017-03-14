import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'
import { mapActions } from 'vuex'
import memory from 'feathers-memory'

describe('Service Module Actions', () => {
  it('Create', (done) => {
    const store = makeStore()
    const feathersClient = makeFeathersRestClient()
      .configure(feathersVuex(store))
    feathersClient.service('todos', memory())
    const todoState = store.state.todos
    const actions = mapActions('todos', ['create'])

    actions.create.call({$store: store}, {description: 'Do the laundry'})
      .then(response => {
        assert(todoState.ids.length === 1)
        assert(todoState.error === undefined)
        assert.deepEqual(todoState.keyedById[response.id], response)
        done()
      })

    // Make sure proper state changes occurred before response
    assert(todoState.ids.length === 0)
    assert(todoState.error === undefined)
    assert(todoState.idField === 'id')
    assert(todoState.service)
    assert.deepEqual(todoState.keyedById, {})
  })
})
