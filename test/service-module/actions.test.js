import assert from 'chai/chai'
import setupVuexService from '~/src/service-module/service-module'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex, { mapActions } from 'vuex'
import memory from 'feathers-memory'

const service = setupVuexService(feathersClient)

describe('Service Module - Actions', () => {
  beforeEach(function () {
    this.todoService = feathersClient.service('todos', memory())
  })
  it('Find', (done) => {
    const store = new Vuex.Store({
      plugins: [service('todos')]
    })
    const todoState = store.state.todos
    const actions = mapActions('todos', ['find'])

    assert(todoState.ids.length === 0, 'no ids before find')
    assert(todoState.errorOnFind === undefined, 'no error before find')
    assert(todoState.isFindPending === false, 'isFindPending is false')
    assert(todoState.idField === 'id', 'idField is `id`')

    feathersClient.service('todos').store = {
      0: { id: 0, description: 'Do the dishes' },
      1: { id: 1, description: 'Do the laundry' },
      2: { id: 2, description: 'Do all the things' }
    }

    actions.find.call({$store: store}, {})
      .then(response => {
        assert(todoState.ids.length === 3, 'three ids populated')
        assert(todoState.errorOnFind === undefined, 'errorOnFind still undefined')
        assert(todoState.isFindPending === false, 'isFindPending is false')
        let expectedKeyedById = {
          0: { id: 0, description: 'Do the dishes' },
          1: { id: 1, description: 'Do the laundry' },
          2: { id: 2, description: 'Do all the things' }
        }
        assert.deepEqual(todoState.keyedById, expectedKeyedById, 'keyedById matches')
        done()
      })

    // Make sure proper state changes occurred before response
    assert(todoState.ids.length === 0)
    assert(todoState.errorOnFind === undefined)
    assert(todoState.isFindPending === true)
    assert.deepEqual(todoState.keyedById, {})
  })

  it('Get', (done) => {
    const store = new Vuex.Store({
      plugins: [service('todos')]
    })
    const todoState = store.state.todos
    const actions = mapActions('todos', ['get'])

    assert(todoState.ids.length === 0)
    assert(todoState.errorOnGet === undefined)
    assert(todoState.isGetPending === false)
    assert(todoState.idField === 'id')

    feathersClient.service('todos').store = {
      0: { id: 0, description: 'Do the dishes' },
      1: { id: 1, description: 'Do the laundry' },
      2: { id: 2, description: 'Do all the things' }
    }

    actions.get.call({$store: store}, 0)
      .then(response => {
        assert(todoState.ids.length === 1, 'only one item is in the store')
        assert(todoState.errorOnGet === undefined, 'there was no errorOnGet')
        assert(todoState.isGetPending === false, 'isGetPending is set to false')
        let expectedKeyedById = {
          0: { id: 0, description: 'Do the dishes' }
        }
        assert.deepEqual(todoState.keyedById, expectedKeyedById)

        // Make a request with the array syntax that allows passing params
        actions.get.call({$store: store}, [1, {}])
          .then(response2 => {
            expectedKeyedById = {
              0: { id: 0, description: 'Do the dishes' },
              1: { id: 1, description: 'Do the laundry' }
            }
            assert(response2.description === 'Do the laundry')
            assert.deepEqual(todoState.keyedById, expectedKeyedById)
            done()
          })
      })

    // Make sure proper state changes occurred before response
    assert(todoState.ids.length === 0)
    assert(todoState.errorOnCreate === undefined)
    assert(todoState.isGetPending === true)
    assert.deepEqual(todoState.keyedById, {})
  })

  it('Create', (done) => {
    const store = new Vuex.Store({
      plugins: [service('todos')]
    })
    const todoState = store.state.todos
    const actions = mapActions('todos', ['create'])

    actions.create.call({$store: store}, {description: 'Do the laundry'})
      .then(response => {
        assert(todoState.ids.length === 1)
        assert(todoState.errorOnCreate === undefined)
        assert(todoState.isCreatePending === false)
        assert.deepEqual(todoState.keyedById[response.id], response)
        done()
      })

    // Make sure proper state changes occurred before response
    assert(todoState.ids.length === 0)
    assert(todoState.errorOnCreate === undefined)
    assert(todoState.isCreatePending === true)
    assert(todoState.idField === 'id')
    assert.deepEqual(todoState.keyedById, {})
  })

  it('Update', (done) => {
    const store = new Vuex.Store({
      plugins: [service('todos')]
    })
    const todoState = store.state.todos
    const actions = mapActions('todos', ['create', 'update'])

    actions.create.call({$store: store}, {description: 'Do the laundry'})
      .then(response => {
        actions.update.call({$store: store}, [0, {id: 0, description: 'Do da dishuz'}])
        .then(responseFromUpdate => {
          assert(todoState.ids.length === 1)
          assert(todoState.errorOnUpdate === undefined)
          assert(todoState.isUpdatePending === false)
          assert.deepEqual(todoState.keyedById[responseFromUpdate.id], responseFromUpdate)
          done()
        })

        // Make sure proper state changes occurred before response
        assert(todoState.ids.length === 1)
        assert(todoState.errorOnUpdate === undefined)
        assert(todoState.isUpdatePending === true)
        assert(todoState.idField === 'id')
      })
      .catch(error => {
        assert(!error, error)
      })
  })

  it('Patch', (done) => {
    const store = new Vuex.Store({
      plugins: [service('todos')]
    })
    const todoState = store.state.todos
    const actions = mapActions('todos', ['create', 'patch'])

    actions.create.call({$store: store}, {description: 'Do the laundry'})
      .then(response => {
        actions.patch.call({$store: store}, [0, {description: 'Write a Vue app'}])
        .then(responseFromPatch => {
          assert(todoState.ids.length === 1)
          assert(todoState.errorOnPatch === undefined)
          assert(todoState.isPatchPending === false)
          assert.deepEqual(todoState.keyedById[responseFromPatch.id], responseFromPatch)
          done()
        })

        // Make sure proper state changes occurred before response
        assert(todoState.ids.length === 1)
        assert(todoState.errorOnPatch === undefined)
        assert(todoState.isPatchPending === true)
        assert(todoState.idField === 'id')
      })
  })

  it('Remove', (done) => {
    const store = new Vuex.Store({
      plugins: [service('todos')]
    })
    const todoState = store.state.todos
    const actions = mapActions('todos', ['create', 'remove'])

    actions.create.call({$store: store}, {description: 'Do the laundry'})
      .then(response => {
        actions.remove.call({$store: store}, 0)
        .then(responseFromRemove => {
          assert(todoState.ids.length === 0)
          assert(todoState.errorOnRemove === undefined)
          assert(todoState.isRemovePending === false)
          assert.deepEqual(todoState.keyedById, {})
          done()
        })

        // Make sure proper state changes occurred before response
        assert(todoState.ids.length === 1)
        assert(todoState.errorOnRemove === undefined)
        assert(todoState.isRemovePending === true)
        assert(todoState.idField === 'id')
      })
  })
})
