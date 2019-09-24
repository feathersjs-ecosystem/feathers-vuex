import assert from 'chai/chai'
import makeServiceGetters from '~/src/service-module/getters'
import makeServiceMutations from '~/src/service-module/mutations'
import makeServiceState from '~/src/service-module/state'

const options = {
  idField: '_id',
  autoRemove: false
}

const { find, list, current } = makeServiceGetters('todos', options)
const { addItems } = makeServiceMutations('todos', options)

describe('Service Module - Getters', function () {
  beforeEach(function () {
    const state = makeServiceState('todos', options)
    this.items = [
      { _id: 0, otherField: true, test: true },
      { _id: 1, otherField: true, test: true },
      {
        _id: 2,
        name: 'Marshall',
        otherField: true,
        test: true,
        movies: [
          { actors: [ 'Jerry the Mouse' ] }
        ]
      },
      {
        _id: 3,
        otherField: true,
        test: false,
        movies: [
          { actors: [ 'Tom Hanks', 'Tom Cruise', 'Tomcat' ] }
        ]
      }
    ]
    addItems(state, this.items)
    state.currentId = 0
    this.state = state
  })

  it('list', function () {
    const { state, items } = this
    const results = list(state)

    assert.deepEqual(results, items, 'the list was correct')
  })

  it('current with id 0', function () {
    const { state, items } = this
    const result = current(state)

    assert.deepEqual(result, items[0], 'current was correct')
  })

  it('find', function () {
    const { state, items } = this
    const params = { query: {} }
    const results = find(state)(params)

    assert.deepEqual(results.data, items, 'the list was correct')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find with query', function () {
    const { state } = this
    const params = { query: { test: false } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with custom operator', function () {
    const { state } = this
    const params = { query: { test: false, $populateQuery: 'test' } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with paramsForServer option', function () {
    const { state } = this
    state.paramsForServer = [ '_$client' ]
    const params = { query: { test: false, _$client: 'test' } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with non-whitelisted custom operator fails', function () {
    const { state } = this
    const params = { query: { $client: 'test' } }
    let results = []
    try {
      results = find(state)(params)
    } catch (error) {
      assert(error)
    }
    assert(!results.length)
  })

  it('find with whitelisted custom operators', function () {
    const { state } = this
    state.whitelist = ['$regex', '$options']
    const query = {
      name: { $regex: 'marsh', $options: 'igm' }
    }
    const params = { query }
    let results = []
    try {
      results = find(state)(params)
    } catch (error) {
      assert(!error, 'should not have failed with whitelisted custom operator')
    }
    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find works with $elemMatch', function () {
    const { state } = this
    const query = {
      movies: {
        $elemMatch: { actors: 'Jerry the Mouse' }
      }
    }
    const params = { query }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with limit', function () {
    const { state } = this
    const params = { query: { $limit: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 0, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find with skip', function () {
    const { state } = this
    const params = { query: { $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 3, 'the length was correct')
    assert(results.data[0]._id === 1, 'the correct record was returned')
    assert(results.data[1]._id === 2, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find with limit and skip', function () {
    const { state } = this
    const params = { query: { $limit: 1, $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 1, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find with select', function () {
    const { state } = this
    const params = { query: { $select: ['otherField'] } }
    const results = find(state)(params)

    assert(results.data.length === 4, 'the length was correct')
    results.data.forEach(result => {
      assert(Object.keys(result).length === 1, 'only one field was returned')
      assert(result.otherField, 'the correct field was returned')
    })
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })
})
