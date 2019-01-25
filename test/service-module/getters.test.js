import assert from 'chai/chai'
import makeServiceGetters from '~/src/service-module/getters'
import makeServiceMutations from '~/src/service-module/mutations'
import makeServiceState from '~/src/service-module/state'

const options = {
  idField: '_id',
  autoRemove: false
}

const { find, list } = makeServiceGetters('todos', options)
const { addItems } = makeServiceMutations('todos', options)

describe('Service Module - Getters', function () {
  beforeEach(function () {
    const state = makeServiceState('todos', options)
    this.items = [
      { _id: 1, otherField: true, test: true },
      { _id: 2, otherField: true, test: true },
      { _id: 3, otherField: true, test: false }
    ]
    addItems(state, this.items)
    this.state = state
  })

  it('list', function () {
    const { state, items } = this
    const results = list(state)

    assert.deepEqual(results, items, 'the list was correct')
  })

  it('find', function () {
    const { state, items } = this
    const params = { query: {} }
    const results = find(state)(params)

    assert.deepEqual(results.data, items, 'the list was correct')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
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

  it('find with limit', function () {
    const { state } = this
    const params = { query: { $limit: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 1, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with skip', function () {
    const { state } = this
    const params = { query: { $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 2, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.data[1]._id === 3, 'the correct record was returned')
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with limit and skip', function () {
    const { state } = this
    const params = { query: { $limit: 1, $skip: 1 } }
    const results = find(state)(params)

    assert(results.data.length === 1, 'the length was correct')
    assert(results.data[0]._id === 2, 'the correct record was returned')
    assert(results.limit === 1, 'limit was correct')
    assert(results.skip === 1, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })

  it('find with select', function () {
    const { state } = this
    const params = { query: { $select: ['otherField'] } }
    const results = find(state)(params)

    assert(results.data.length === 3, 'the length was correct')
    results.data.forEach(result => {
      assert(Object.keys(result).length === 1, 'only one field was returned')
      assert(result.otherField, 'the correct field was returned')
    })
    assert(results.limit === 0, 'limit was correct')
    assert(results.skip === 0, 'skip was correct')
    assert(results.total === 3, 'total was correct')
  })
})
