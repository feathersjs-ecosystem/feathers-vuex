import assert from 'chai/chai'
import setupVuexService from '~/src/service-module/service-module'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import Vuex, { mapActions } from 'vuex'
import memory from 'feathers-memory'

const service = setupVuexService(feathersClient)
const makeStore = () => {
  return {
    0: { id: 0, description: 'Do the first' },
    1: { id: 1, description: 'Do the second' },
    2: { id: 2, description: 'Do the third' },
    3: { id: 3, description: 'Do the fourth' },
    4: { id: 4, description: 'Do the fifth' },
    5: { id: 5, description: 'Do the sixth' },
    6: { id: 6, description: 'Do the seventh' },
    7: { id: 7, description: 'Do the eighth' },
    8: { id: 8, description: 'Do the ninth' },
    9: { id: 9, description: 'Do the tenth' }
  }
}

describe('Service Module - Actions', () => {
  beforeEach(function () {
    this.todoService = feathersClient.service('todos', memory({
      store: makeStore()
    }))

    this.taskService = feathersClient.service('tasks', memory({
      store: makeStore(),
      paginate: {
        default: 10,
        max: 50
      }
    }))
  })

  describe('Find without pagination', function () {
    it('Find without pagination', (done) => {
      const store = new Vuex.Store({
        plugins: [service('todos')]
      })
      const todoState = store.state.todos
      const actions = mapActions('todos', ['find'])

      assert(todoState.ids.length === 0, 'no ids before find')
      assert(todoState.errorOnFind === undefined, 'no error before find')
      assert(todoState.isFindPending === false, 'isFindPending is false')
      assert(todoState.idField === 'id', 'idField is `id`')

      actions.find.call({$store: store}, {})
        .then(response => {
          assert(todoState.ids.length === 10, 'three ids populated')
          assert(todoState.errorOnFind === undefined, 'errorOnFind still undefined')
          assert(todoState.isFindPending === false, 'isFindPending is false')
          let expectedKeyedById = makeStore()
          assert.deepEqual(todoState.keyedById, expectedKeyedById, 'keyedById matches')
          done()
        })

      // Make sure proper state changes occurred before response
      assert(todoState.ids.length === 0)
      assert(todoState.errorOnFind === undefined)
      assert(todoState.isFindPending === true)
      assert.deepEqual(todoState.keyedById, {})
    })

    it('find with limit', function (done) {
      const store = new Vuex.Store({
        plugins: [service('todos')]
      })
      const actions = mapActions('todos', ['find'])

      actions.find.call({$store: store}, { query: { $limit: 1 } })
      .then(response => {
        assert(response.length === 1, 'only one record was returned')
        assert.deepEqual(response[0], { id: 0, description: 'Do the first' }, 'the first record was returned')
        done()
      })
    })

    it('find with skip', function (done) {
      const store = new Vuex.Store({
        plugins: [service('todos')]
      })
      const actions = mapActions('todos', ['find'])

      actions.find.call({$store: store}, { query: { $skip: 9 } })
      .then(response => {
        assert(response.length === 1, 'one record was returned')
        assert.deepEqual(response[0], { id: 9, description: 'Do the tenth' }, 'the tenth record was returned')
        done()
      })
    })

    it('Find with limit and skip', function (done) {
      const store = new Vuex.Store({
        plugins: [service('todos')]
      })
      const actions = mapActions('todos', ['find'])

      actions.find.call({$store: store}, { query: { $limit: 1, $skip: 8 } })
      .then(response => {
        assert(response.length === 1, 'one record was returned')
        assert.deepEqual(response[0], { id: 8, description: 'Do the ninth' }, 'the ninth record was returned')
        done()
      })
    })
  })

  describe('Find with pagination', function () {
    it('find with limit', function (done) {
      const store = new Vuex.Store({
        plugins: [service('tasks')]
      })
      const actions = mapActions('tasks', ['find'])

      actions.find.call({$store: store}, { query: { $limit: 1 } })
      .then(response => {
        assert(response.data.length === 1, 'only one record was returned')
        assert.deepEqual(response.data[0], { id: 0, description: 'Do the first' }, 'the first record was returned')
        assert(response.limit === 1, 'limit was correct')
        assert(response.skip === 0, 'skip was correct')
        assert(response.total === 10, 'total was correct')
        done()
      })
    })

    it('find with skip', function (done) {
      const store = new Vuex.Store({
        plugins: [service('tasks')]
      })
      const actions = mapActions('tasks', ['find'])

      actions.find.call({$store: store}, { query: { $skip: 9 } })
      .then(response => {
        assert(response.data.length === 1, 'only one record was returned')
        assert.deepEqual(response.data[0], { id: 9, description: 'Do the tenth' }, 'the tenth record was returned')
        assert(response.limit === 10, 'limit was correct')
        assert(response.skip === 9, 'skip was correct')
        assert(response.total === 10, 'total was correct')
        done()
      })
    })

    it('find with limit and skip', function (done) {
      const store = new Vuex.Store({
        plugins: [service('tasks')]
      })
      const actions = mapActions('tasks', ['find'])

      actions.find.call({$store: store}, { query: { $limit: 1, $skip: 8 } })
      .then(response => {
        assert(response.data.length === 1, 'only one record was returned')
        assert.deepEqual(response.data[0], { id: 8, description: 'Do the ninth' }, 'the ninth record was returned')
        assert(response.limit === 1, 'limit was correct')
        assert(response.skip === 8, 'skip was correct')
        assert(response.total === 10, 'total was correct')
        done()
      })
    })

    it('adds default pagination data to the store', function (done) {
      const store = new Vuex.Store({
        plugins: [service('tasks')]
      })
      const actions = mapActions('tasks', ['find'])

      actions.find.call({$store: store}, { query: {} })
      .then(response => {
        const { ids, limit, skip, total } = store.state.tasks.pagination.default
        assert(ids.length === 10, 'ten ids were returned in this page')
        assert(limit === 10, 'limit matches the default pagination limit on the server')
        assert(skip === 0, 'skip was correct')
        assert(total === 10, 'total was correct')
        done()
      })
    })

    it('can provide a query identifier to store pagination', function (done) {
      const store = new Vuex.Store({
        plugins: [service('tasks')]
      })
      const actions = mapActions('tasks', ['find'])
      const qid = 'component-name'

      actions.find.call({$store: store}, { query: {}, qid })
      .then(response => {
        const { ids, limit, skip, total } = store.state.tasks.pagination[qid]
        assert(ids.length === 10, 'ten ids were returned in this page')
        assert(limit === 10, 'limit matches the default pagination limit on the server')
        assert(skip === 0, 'skip was correct')
        assert(total === 10, 'total was correct')
        done()
      })
    })

    it('updates properly with limit and skip', function (done) {
      const store = new Vuex.Store({
        plugins: [service('tasks')]
      })
      const actions = mapActions('tasks', ['find'])
      const qid = 'component-name'

      actions.find.call({$store: store}, { query: { $limit: 5, $skip: 2 }, qid })
      .then(response => {
        const { ids, limit, skip, total } = store.state.tasks.pagination[qid]
        assert(ids.length === 5, 'ten ids were returned in this page')
        assert(limit === 5, 'limit matches the default pagination limit on the server')
        assert(skip === 2, 'skip was correct')
        assert(total === 10, 'total was correct')
        done()
      })
    })

    it('works with multiple queries and identifiers', function (done) {
      const store = new Vuex.Store({
        plugins: [service('tasks')]
      })
      const actions = mapActions('tasks', ['find'])
      const qids = [
        'component-query-zero',
        'component-query-one'
      ]

      actions.find.call({$store: store}, { query: {}, qid: qids[0] })
      .then(response => actions.find.call({$store: store}, { query: {}, qid: qids[1] }))
      .then(response => {
        qids.forEach(qid => {
          const { ids, limit, skip, total } = store.state.tasks.pagination[qid]
          assert(ids.length === 10, 'ten ids were returned in this page')
          assert(limit === 10, 'limit matches the default pagination limit on the server')
          assert(skip === 0, 'skip was correct')
          assert(total === 10, 'total was correct')
        })

        done()
      })
    })
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

    actions.get.call({$store: store}, 0)
      .then(response => {
        assert(todoState.ids.length === 1, 'only one item is in the store')
        assert(todoState.errorOnGet === undefined, 'there was no errorOnGet')
        assert(todoState.isGetPending === false, 'isGetPending is set to false')
        let expectedKeyedById = {
          0: { id: 0, description: 'Do the first' }
        }
        assert.deepEqual(todoState.keyedById, expectedKeyedById)

        // Make a request with the array syntax that allows passing params
        actions.get.call({$store: store}, [1, {}])
          .then(response2 => {
            expectedKeyedById = {
              0: { id: 0, description: 'Do the first' },
              1: { id: 1, description: 'Do the second' }
            }
            assert(response2.description === 'Do the second')
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

    actions.create.call({$store: store}, {description: 'Do the second'})
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

    actions.create.call({$store: store}, {description: 'Do the second'})
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

    actions.create.call({$store: store}, {description: 'Do the second'})
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

    actions.create.call({$store: store}, {description: 'Do the second'})
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
