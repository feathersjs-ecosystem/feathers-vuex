/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import makeServiceGetters from '../../src/service-module/service-module.getters'
import makeServiceMutations from '../../src/service-module/service-module.mutations'
import makeServiceState from '../../src/service-module/service-module.state'

const options = {
  idField: '_id',
  tempIdField: '__id',
  autoRemove: false,
  serverAlias: 'default'
}

const { find, list, get } = makeServiceGetters()
const { addItems } = makeServiceMutations()

describe('Service Module - Getters', function() {
  beforeEach(function() {
    const state = makeServiceState('getter-todos', options)
    this.items = [
      { _id: 1, otherField: true, test: true },
      {
        _id: 2,
        name: 'Marshall',
        otherField: true,
        test: true,
        movies: [{ actors: ['Jerry the Mouse'] }]
      },
      {
        _id: 3,
        otherField: true,
        test: false,
        movies: [{ actors: ['Tom Hanks', 'Tom Cruise', 'Tomcat'] }]
      },
      {
        name: 'Mariah',
        status: 'temp'
      }
    ]
    addItems(state, this.items)
    this.state = state
  })

  it('list', function() {
    const { state, items } = this
    const results = list(state)

    results.forEach((record, index) => {
      const item = items[index]

      assert.deepEqual(record, item, 'item in correct order')
    })
  })

  it('get works on keyedById', function() {
    const { state, items } = this
    // @ts-ignore
    const result = get(state)(1)

    // @ts-ignore
    assert.deepEqual(result, items[0])
  })

  it('get works on tempsById', function() {
    const { state, items } = this
    const tempId = Object.keys(state.tempsById)[0]
    // @ts-ignore
    const result = get(state)(tempId)

    // @ts-ignore
    assert(result.__id === tempId)
  })

  it('find', function() {
    const { state, items } = this
    const params = { query: {} }
    const results = find(state)(params)

    assert.deepEqual(results.data, items, 'the list was correct')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find without temps', function() {
    const { state, items } = this
    // Set temps: false to skip the temps.
    const params = { query: {}, temps: false }
    const results = find(state)(params)

    assert.deepEqual(
      results.data,
      items.filter(i => i._id),
      'the list was correct'
    )
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with query', function() {
    const { state } = this
    const params = { query: { test: false } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with custom operator', function() {
    const { state } = this
    const params = { query: { test: false, $populateQuery: 'test' } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with paramsForServer option', function() {
    const { state } = this
    state.paramsForServer = ['_$client']
    const params = { query: { test: false, _$client: 'test' } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find with non-whitelisted custom operator fails', function() {
    const { state } = this
    const params = { query: { $client: 'test' } }
    try {
      var results = find(state)(params)
    } catch (error) {
      assert(error)
    }
    assert(!results[0])
  })

  it('find with whitelisted custom operators', function() {
    const { state } = this
    state.whitelist = ['$regex', '$options']
    const query = {
      name: { $regex: 'marsh', $options: 'igm' }
    }
    const params = { query }
    try {
      var results = find(state)(params)
    } catch (error) {
      assert(!error, 'should not have failed with whitelisted custom operator')
    }
    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 1, 'total was correct')
  })

  it('find works with $elemMatch', function() {
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

  it('find with limit', function() {
    const { state } = this
    const params = { query: { $limit: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 1, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find with skip', function() {
    const { state } = this
    const params = { query: { $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 3, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.data[1]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find with limit and skip', function() {
    const { state } = this
    const params = { query: { $limit: 1, $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })

  it('find with select', function() {
    const { state } = this
    const params = { query: { $select: ['otherField'] } }
    const results = find(state)(params)

    assert(results.data.length === 4, 'the length was correct')
    results.data.forEach(result => {
      assert(Object.keys(result).length <= 1, 'only one field was returned')
    })
    assert.equal(
      results.data.filter(i => i.otherField).length,
      3,
      'three records have the field.'
    )
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 4, 'total was correct')
  })
})
