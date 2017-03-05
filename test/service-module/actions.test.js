import assert from 'chai/chai'
import feathersVuex from '~/src/index'
import makeStore from '../fixtures/store'
import { makeFeathersRestClient } from '../fixtures/feathers-client'
import { mapActions } from 'vuex'

describe('Service Module Actions', () => {
  it('Create', (done) => {
    const store = makeStore()
    const feathersClient = makeFeathersRestClient()
      .configure(feathersVuex(store, {idField: '_id'}))
    feathersClient.service('todos')
    const todoState = store.state.todos
    const actions = mapActions('todos', ['create'])

    actions.create.call({$store: store}, {description: 'Do the laundry'})
      .then(response => {
        assert(todoState.ids.length === 1)
        assert(todoState.isPending === false)
        assert(todoState.isError === false)
        assert(todoState.error === undefined)
        assert.deepEqual(todoState.keyedById[response._id], response)
        done()
      })

    // Make sure proper state changes occurred before response
    assert(todoState.ids.length === 0)
    assert(todoState.isPending === true)
    assert(todoState.isError === false)
    assert(todoState.error === undefined)
    assert(todoState.idField === '_id')
    assert(todoState.service)
    assert.deepEqual(todoState.keyedById, {})
  })
})
