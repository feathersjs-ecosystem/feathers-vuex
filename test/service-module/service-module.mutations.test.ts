/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import { assertGetter, makeStore } from '../test-utils'
import makeServiceMutations from '../../src/service-module/service-module.mutations'
import makeServiceState from '../../src/service-module/service-module.state'
import errors from '@feathersjs/errors'
import Vue from 'vue'
import Vuex from 'vuex'
import fakeData from '../fixtures/fake-data'
import { Service as MemoryService } from 'feathers-memory'
import { getQueryInfo } from '../../src/utils'
import { diff as deepDiff } from 'deep-object-diff'
import omitDeep from 'omit-deep-lodash'
import feathersVuex from '../../src/index'

import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'

import {
  globalModels,
  clearModels
} from '../../src/service-module/global-models'

const { BaseModel } = feathersVuex(feathersClient, {
  serverAlias: 'mutations'
})

Vue.use(Vuex)

class Todo extends BaseModel {
  public static modelName = 'Todo'
  public static test = true
}

const options = {
  idField: '_id',
  tempIdField: '__id',
  autoRemove: false,
  serverAlias: 'myApi',
  service: feathersClient.service('mutations-todo'),
  Model: Todo
}

const {
  addItem,
  addItems,
  updateItem,
  updateItems,
  removeItem,
  removeItems,
  clearAll,
  createCopy,
  resetCopy,
  commitCopy,
  clearCopy,
  updatePaginationForQuery,
  setPending,
  unsetPending,
  setError,
  clearError
} = makeServiceMutations()

class ComicService extends MemoryService {
  public create(data, params) {
    return super.create(data, params).then(response => {
      delete response.__id
      delete response.__isTemp
      return response
    })
  }
  // @ts-ignore
  public update(id, data, params) {
    data.createdAt = new Date()
    // this._super(data, params, callback)
  }
}

function makeContext() {
  feathersClient.use(
    'comics',
    // @ts-ignore
    new ComicService({ store: makeStore() })
  )
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'service-module-mutations'
  })
  class Comic extends BaseModel {
    public static modelName = 'Comic'
    public static test = true

    public constructor(data, options?) {
      super(data, options)
    }
  }
  const store = new Vuex.Store({
    strict: true,
    plugins: [
      makeServicePlugin({
        Model: Comic,
        service: feathersClient.service('comics'),
        servicePath: 'comics',
        idField: '_id',
        tempIdField: '__id'
      })
    ]
  })
  return {
    makeServicePlugin,
    BaseModel,
    Comic,
    store
  }
}

describe('Service Module - Mutations', function () {
  beforeEach(function () {
    this.state = makeServiceState(options)
    this.state.keepCopiesInStore = true
  })

  describe('Create, Update, Remove', function () {
    it('addItem', function () {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }

      addItem(state, item1)
      assert(state.ids.length === 1)
      assert(state.ids[0] === 1)
      assert(state.keyedById[1].test)

      // Add item 2
      addItem(state, item2)
      assert(state.ids.length === 2)
      assert(state.ids[1] === 2)
      assert(state.keyedById[2].test)

      // Re-add item 1
      addItem(state, item1)
      assert(state.ids.length === 2, 'still only two items in the ids array')
      assert(state.ids[0] === 1)
      assert(state.keyedById[1].test)
      assert(state.ids[1] === 2)
      assert(state.keyedById[2].test)
    })

    it('addItems', function () {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }
      const items = [item1, item2]
      addItems(state, items)
      assert(state.ids.length === 2, 'still only two items in the ids array')
      assert(state.ids[0] === 1)
      assert(state.keyedById[1].test)
      assert(state.ids[1] === 2)
      assert(state.keyedById[2].test)
    })

    it('updateItems', function () {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }
      const items = [item1, item2]
      addItems(state, items)

      const item1updated = {
        _id: 1,
        test: false
      }
      const item2updated = {
        _id: 2,
        test: false
      }
      const itemsToUpdate = [item1updated, item2updated]
      updateItems(state, itemsToUpdate)

      assert(state.keyedById[1].test === false)
      assert(state.keyedById[2].test === false)
    })

    it('removeItem', function () {
      const state = this.state

      addItem(state, { _id: 1, test: true })
      removeItem(state, 1)

      assert(state.ids.length === 0)
      assert(Object.keys(state.keyedById).length === 0)
    })

    it('removeItem also removes clone', function () {
      const state = this.state

      const _id = 1

      addItem(state, { _id, test: true })
      createCopy(state, _id)

      assert(state.copiesById[_id], 'clone exists')

      removeItem(state, _id)

      assert(!state.copiesById[_id], 'clone is removed')
    })

    it('removeItem also removes clone with keepCopiesInStore', function () {
      const context = makeContext()
      const { Comic, store } = context

      const _id = 1

      store.commit('comics/addItem', { _id, test: true })
      store.commit('comics/createCopy', _id)

      assert(Comic.copiesById[_id], 'clone exists')

      store.commit('comics/removeItem', _id)

      assert(!Comic.copiesById[_id], 'clone is removed')
    })

    it('removeItems with array of ids', function () {
      const state = this.state
      const items = [
        { _id: 1, test: true },
        { _id: 2, test: true },
        { _id: 3, test: true },
        { _id: 4, test: true }
      ]
      addItems(state, items)
      const itemsToRemove = [1, 2]
      removeItems(state, itemsToRemove)

      assert(state.ids.length === 2, 'should have 2 ids left')
      assert(
        Object.keys(state.keyedById).length === 2,
        'should have 2 items left'
      )
    })

    it('removeItems with array of items', function () {
      const state = this.state
      const items = [
        { _id: 1, test: true },
        { _id: 2, test: true },
        { _id: 3, test: true },
        { _id: 4, test: true }
      ]
      addItems(state, items)
      const itemsToRemove = [
        { _id: 1, test: true },
        { _id: 2, test: true }
      ]
      removeItems(state, itemsToRemove)

      assert(state.ids.length === 2, 'should have 2 ids left')
      assert(
        Object.keys(state.keyedById).length === 2,
        'should have 2 items left'
      )
    })

    it('removeItems also removes clone', function () {
      const state = this.state

      addItems(state, [
        { _id: 1, test: true },
        { _id: 2, test: true },
        { _id: 3, test: true },
        { _id: 4, test: true }
      ])
      const itemsToRemove = [1, 2]
      createCopy(state, 1)
      createCopy(state, 3)

      assert(state.copiesById[1], 'clone exists')

      removeItems(state, itemsToRemove)

      assert(!state.copiesById[1], 'clone is removed')
      assert(state.copiesById[3], 'other clone is not affected')
    })

    it('removeItems also removes clone with keepCopiesInStore', function () {
      const context = makeContext()
      const { Comic, store } = context

      store.commit('comics/addItems', [
        { _id: 1, test: true },
        { _id: 2, test: true },
        { _id: 3, test: true },
        { _id: 4, test: true }
      ])

      const itemsToRemove = [1, 2]
      store.commit('comics/createCopy', 1)
      store.commit('comics/createCopy', 3)

      assert(Comic.copiesById[1], 'clone exists')

      store.commit('comics/removeItems', itemsToRemove)

      assert(!Comic.copiesById[1], 'clone is removed')
      assert(Comic.copiesById[3], 'other clone is not affected')
    })

    it('clearAll', function () {
      const state = this.state

      assert(state.ids.length === 0, 'initialy empty')
      assert(Object.keys(state.keyedById).length === 0, 'initialy empty')
      assert(Object.keys(state.copiesById).length === 0, 'initialy empty')

      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }
      const items = [item1, item2]
      addItems(state, items)

      createCopy(state, item1._id)

      assert(state.ids.length === 2, 'ids are added correctly')
      assert(
        Object.keys(state.keyedById).length === 2,
        'items are added correctly'
      )
      assert(
        Object.keys(state.copiesById).length === 1,
        'clone is added correctly'
      )

      clearAll(state)
      assert(state.ids.length === 0, 'ids empty again')
      assert(Object.keys(state.keyedById).length === 0, 'items empty again')
      assert(Object.keys(state.copiesById).length === 0, 'clones empty again')
    })

    it('clearAll with keepCopiesInStore: false', function () {
      const context = makeContext()
      const { Comic, store } = context
      // @ts-ignore
      const state = store.state.comics

      assert(state.ids.length === 0, 'initialy empty')
      assert(Object.keys(state.keyedById).length === 0, 'initialy empty')
      assert(Object.keys(Comic.copiesById).length === 0, 'initialy empty')

      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }
      const items = [item1, item2]
      store.commit('comics/addItems', items)
      store.commit('comics/createCopy', item1._id)

      assert(state.ids.length === 2, 'ids are added correctly')
      assert(
        Object.keys(state.keyedById).length === 2,
        'items are added correctly'
      )
      assert(
        Object.keys(Comic.copiesById).length === 1,
        'clone is added correctly'
      )

      store.commit('comics/clearAll')

      assert(state.ids.length === 0, 'ids empty again')
      assert(Object.keys(state.keyedById).length === 0, 'items empty again')
      assert(Object.keys(Comic.copiesById).length === 0, 'clones empty again')
    })
  })

  describe('updateItem', function () {
    it('updates existing item when addOnUpsert=true', function () {
      const state = this.state
      state.addOnUpsert = true
      const item1 = {
        _id: 1,
        test: true
      }
      const items = [item1]
      addItems(state, items)

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert(state.keyedById[1].test === false)
    })

    it('updates existing item when addOnUpsert=false', function () {
      const state = this.state
      state.addOnUpsert = false
      const item1 = {
        _id: 1,
        test: true
      }
      const items = [item1]
      addItems(state, items)

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert(state.keyedById[1].test === false)
    })

    it('adds non-existing item when addOnUpsert=true', function () {
      const state = this.state
      state.addOnUpsert = true

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert.deepEqual(
        [state.addOnUpsert, state.ids, state.keyedById],
        [true, [1], { 1: { _id: 1, test: false } }]
      )
      // assert(state.keyedById[1].test === false)
    })

    it('discards non-existing item when addOnUpsert=false', function () {
      const state = this.state
      state.addOnUpsert = false

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert(state.keyedById[1] == null)
    })
  })

  describe('Vue event bindings', function () {
    it('does not break when attempting to overwrite a getter', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        get getter() {
          return 'Release the flying monkeys!'
        }
      }
      assertGetter(item1, 'getter', 'Release the flying monkeys!')
      const items = [item1]

      addItems(state, items)

      // Prove the getter is still in place in the store
      assertGetter(state.keyedById[1], 'getter', 'Release the flying monkeys!')

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.getter'() {
            // eslint-disable-next-line no-console
            console.log(state.keyedById)
            throw new Error('this should never happen')
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        getter: true
      }
      updateItem(state, updatedItem)

      assert(state.keyedById[1].getter === 'Release the flying monkeys!')
      done()
    })

    it('correctly emits events for existing array properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true,
        users: ['Marshall', 'Mariah']
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.users'() {
            assert(this.item.users.length === 3)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        test: false,
        users: ['Marshall', 'Mariah', 'Scooby Doo']
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new array properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.users'() {
            assert(this.item.users.length === 3)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        test: false,
        users: ['Marshall', 'Mariah', 'Scooby Doo']
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing object properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        obj: { test: true }
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.obj'() {
            assert(this.item.obj.test === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        obj: { test: false }
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new object properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.obj'() {
            assert(this.item.obj.test === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        obj: { test: false }
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing boolean properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        isValid: true
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.isValid'() {
            assert(this.item.isValid === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        isValid: false
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new boolean properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.isValid'() {
            assert(this.item.isValid === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        isValid: false
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing string properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        name: 'Marshall'
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === 'Xavier')
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: 'Xavier'
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new string properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === 'Xavier')
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: 'Xavier'
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing null properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        name: null
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === 'Xavier')
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: 'Xavier'
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for properties set to null', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        name: 'Marshall'
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === null)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: null
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing number properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        age: 45
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.age'() {
            assert(this.item.age === 50)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        age: 50
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new number properties', function (done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.age'() {
            assert(this.item.age === 50)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        age: 50
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events after commitCopy', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        obj: { test: true },
        get getter() {
          return this.obj.test
        },
        set setter(val) {
          this.obj.test = val
        }
      }
      const items = [item1]

      addItems(state, items)
      const item = state.keyedById[item1._id]

      createCopy(state, item._id)
      const copy = state.copiesById[item1._id]

      const vm = new Vue({
        data: {
          item,
          copy
        },
        watch: {
          'item.obj': {
            handler() {
              assert(this.item.obj.test === false)
              done()
            },
            deep: true
          }
        }
      })

      assert(vm.item, 'vm has item')
      assert(vm.copy, 'vm has copy')

      // Modify copy and commit
      vm.copy.setter = false
      commitCopy(state, item1._id)

      assert(item.obj.test === false, 'deep obj should be false')
      assert(vm.item.obj.test === false, 'deep obj should be false')
    })

    it('correctly emits events after resetCopy', function (done) {
      const state = this.state
      const item1 = {
        _id: 1,
        obj: { test: true },
        get getter() {
          return this.obj.test
        },
        set setter(val) {
          this.obj.test = val
        }
      }
      const items = [item1]

      addItems(state, items)
      const item = state.keyedById[item1._id]

      // createCopy and modify, but don't commit
      createCopy(state, item._id)
      const copy = state.copiesById[item1._id]
      copy.setter = false

      const vm = new Vue({
        data: {
          item,
          copy
        },
        watch: {
          'copy.obj': {
            handler() {
              assert(this.copy.obj.test === true)
              done()
            },
            deep: true
          }
        }
      })

      assert(vm.item, 'vm has item')
      assert(vm.copy, 'vm has copy')

      resetCopy(state, item1._id)

      assert(item.obj.test === true, 'deep obj should be true')
      assert(vm.item.obj.test === true, 'deep obj should be true')
    })
  })

  describe('Copy & Commit', function () {
    it('createCopy', function () {
      const { state } = this
      const item1 = {
        _id: 1,
        test: true,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }
      }
      addItem(state, item1)
      const original = state.keyedById[1]

      createCopy(state, item1._id)

      const copy = state.copiesById[item1._id]

      assert.deepEqual(
        original,
        copy,
        `original and copy have the same properties`
      )

      copy.setter = false
      assert(copy.getter === 'Life is a Joy!', `getter was preserved`)
      assert(copy.test === false, `copy was changed through setter`)
      assert(original.test === true, `original item intact after copy changed`)
    })

    it('createCopy with keepCopiesInStore: false', function () {
      const context = makeContext()
      const { Comic, store } = context

      const item1 = {
        _id: 1,
        test: true
      }
      store.commit('comics/addItem', item1)

      // @ts-ignore
      const original = store.state.comics.keyedById[1]

      store.commit('comics/createCopy', item1._id)

      const copy = Comic.copiesById[item1._id]

      assert.deepEqual(
        original,
        copy,
        `original and copy have the same properties`
      )

      copy.test = false
      assert(copy.test === false, `copy was changed through setter`)
      assert(original.test === true, `original item intact after copy changed`)

      clearModels()
    })

    it('createCopy of temp', function () {
      const { state } = this
      const item1 = {
        __id: 'abc',
        test: true,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }
      }
      addItem(state, item1)
      const original = state.tempsById[item1[state.tempIdField]]

      createCopy(state, original[state.tempIdField])

      const copy = state.copiesById[original[state.tempIdField]]

      copy.setter = false
      assert(copy.getter === 'Life is a Joy!', `getter was preserved`)
      assert(copy.test === false, `copy was changed through setter`)
      assert(original.test === true, `original item intact after copy changed`)
    })

    it('createCopy of temp with keepCopiesInStore: false', function () {
      const context = makeContext()
      const { Comic, store } = context

      const item1 = {
        __id: 'abc',
        test: true
      }
      store.commit('comics/addItem', item1)

      // @ts-ignore
      const original = store.state.comics.tempsById[item1.__id]

      store.commit('comics/createCopy', item1.__id)

      const copy = Comic.copiesById[item1.__id]

      copy.test = false
      assert(copy.test === false, `copy was changed through setter`)
      assert(original.test === true, `original item intact after copy changed`)

      clearModels()
    })

    it('createCopy while existing copy', function () {
      const { state } = this
      const item1 = {
        _id: 1,
        test: true
      }
      addItem(state, item1)

      const original = state.keyedById[1]

      createCopy(state, item1._id)

      const copy = state.copiesById[item1._id]
      copy.test = false

      createCopy(state, item1._id)

      const copy2 = state.copiesById[item1._id]

      assert(copy === copy2, `only one clone exists`)
      assert(
        copy.test === true && copy2.test === true,
        `new clone overwrites old clone`
      )
    })

    it('createCopy while existing copy with keepCopiesInStore: false', function () {
      const context = makeContext()
      const { Comic, store } = context

      const item1 = {
        _id: 1,
        test: true
      }
      store.commit('comics/addItem', item1)

      // @ts-ignore
      const original = store.state.comics.keyedById[1]

      store.commit('comics/createCopy', item1._id)
      const copy = Comic.copiesById[item1._id]
      copy.test = false

      store.commit('comics/createCopy', original._id)
      const copy2 = Comic.copiesById[item1._id]

      assert(copy === copy2, `only one clone exists`)
      assert(
        copy.test === true && copy2.test === true,
        `new clone overwrites old clone`
      )

      clearModels()
    })

    it('resetCopy', function () {
      const { state } = this
      const item1 = {
        _id: 1,
        test: true,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }
      }
      addItem(state, item1)

      // Create a copy and modify it.
      createCopy(state, item1._id)
      const copy = state.copiesById[item1._id]
      copy.test = false

      // Call resetCopy and check that it's back to the original value
      resetCopy(state, item1._id)
      assert(copy.test === true, 'the copy was reset')

      // Make sure accessors stayed intact
      assertGetter(copy, 'getter', 'Life is a Joy!')
      copy.setter = false
      assert(copy.test === false, 'the setter is intact')
    })

    it('resetCopy with keepCopiesInStore: false', function () {
      const context = makeContext()
      const { Comic, store } = context

      const item1 = {
        _id: 1,
        test: true /*,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }*/
      }
      store.commit('comics/addItem', item1)

      // Create a copy and modify it.
      store.commit('comics/createCopy', item1._id)
      const copy = Comic.copiesById[item1._id]
      copy.test = false

      // Call resetCopy and check that it's back to the original value
      store.commit('comics/resetCopy', item1._id)

      assert(copy.test === true, 'the copy was reset')

      // Make sure accessors stayed intact
      //assertGetter(copy, 'getter', 'Life is a Joy!')
      //copy.setter = false
      //assert(copy.test === false, 'the setter is intact')

      clearModels()
    })

    it('commitCopy', function () {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }
      }
      addItem(state, item1)
      const original = state.keyedById[item1._id]

      // Create a copy and modify it.
      createCopy(state, item1._id)
      const copy = state.copiesById[item1._id]
      copy.test = false

      commitCopy(state, item1._id)
      assert(copy.test === false, `the copy wasn't changed after commitCopy`)
      assert(original.test === false, 'original item updated after commitCopy')
    })

    it('commitCopy with keepCopiesInStore: false', function () {
      const context = makeContext()
      const { Comic, store } = context

      const item1 = {
        _id: 1,
        test: true
      }
      store.commit('comics/addItem', item1)
      // @ts-ignore
      const original = store.state.comics.keyedById[item1._id]

      // Create a copy and modify it.
      store.commit('comics/createCopy', item1._id)
      const copy = Comic.copiesById[item1._id]
      copy.test = false

      store.commit('comics/commitCopy', item1._id)

      assert(copy.test === false, `the copy wasn't changed after commitCopy`)
      assert(original.test === false, 'original item updated after commitCopy')

      clearModels()
    })

    it('clearCopy', function () {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      addItem(state, item1)

      // Create a copy then clear it.
      createCopy(state, item1._id)
      assert(state.copiesById[item1._id], `the copy is there!`)
      clearCopy(state, item1._id)
      assert(!state.copiesById[item1._id], `the copy is gone!`)
    })

    it('clearCopy with keepCopiesInStore: false', function () {
      const context = makeContext()
      const { Comic, store } = context

      const item1 = { _id: 1, test: true }
      store.commit('comics/addItem', item1)

      // Create a copy then clear it.
      store.commit('comics/createCopy', item1._id)

      assert(Comic.copiesById[item1._id], `the copy is there!`)
      store.commit('comics/clearCopy', item1._id)
      assert(!Comic.copiesById[item1._id], `the copy is gone!`)

      clearModels()
    })
  })

  describe('Pagination', function () {
    it('updatePaginationForQuery', function () {
      this.timeout(600000)
      const state = this.state
      const qid = 'main-list'
      const decisionTable = [
        {
          description: 'initial query empty',
          query: {},
          response: {
            data: fakeData.transactions.slice(0, 10),
            limit: 10,
            skip: 0,
            total: fakeData.transactions.length
          },
          makeResult(props) {
            const {
              query,
              queryId,
              queryParams,
              pageId,
              pageParams,
              queriedAt
            } = props

            return {
              defaultLimit: 10,
              defaultSkip: 0,
              'main-list': {
                mostRecent: {
                  query,
                  queryId,
                  queryParams,
                  pageId,
                  pageParams,
                  queriedAt,
                  total: 155
                },
                '{}': {
                  total: fakeData.transactions.length,
                  queryParams: {},
                  ["{\"$limit\":10,\"$skip\":0}"]: { //eslint-disable-line
                    pageParams,
                    ids: fakeData.transactions
                      .slice(0, 10)
                      .map(i => i[state.idField]),
                    queriedAt
                  }
                }
              }
            }
          }
        },
        {
          description: 'initial query, limit 10, skip 0',
          query: { $limit: 10 },
          response: {
            data: fakeData.transactions.slice(0, 10),
            limit: 10,
            skip: 0,
            total: fakeData.transactions.length
          },
          makeResult(props) {
            const {
              query,
              queryId,
              queryParams,
              pageId,
              pageParams,
              queriedAt
            } = props

            return {
              defaultLimit: 10,
              defaultSkip: 0,
              'main-list': {
                mostRecent: {
                  query,
                  queryId,
                  queryParams,
                  pageId,
                  pageParams,
                  queriedAt,
                  total: 155
                },
                '{}': {
                  total: fakeData.transactions.length,
                  queryParams: {},
                  ["{\"$limit\":10,\"$skip\":0}"]: { //eslint-disable-line
                    pageParams,
                    ids: fakeData.transactions
                      .slice(0, 10)
                      .map(i => i[state.idField]),
                    queriedAt
                  }
                }
              }
            }
          }
        },
        {
          description: 'initial query, limit 10, skip 10',
          query: { $limit: 10, $skip: 10 },
          response: {
            data: fakeData.transactions.slice(10, 20),
            limit: 10,
            skip: 10,
            total: fakeData.transactions.length
          },
          makeResult(props) {
            const {
              query,
              queryId,
              queryParams,
              pageId,
              pageParams,
              queriedAt
            } = props

            return {
              defaultLimit: 10,
              defaultSkip: 0,
              'main-list': {
                mostRecent: {
                  query,
                  queryId,
                  queryParams,
                  pageId,
                  pageParams,
                  queriedAt,
                  total: 155
                },
                '{}': {
                  total: fakeData.transactions.length,
                  queryParams: {},
                  ["{\"$limit\":10,\"$skip\":0}"]: { //eslint-disable-line
                    pageParams: {
                      $limit: 10,
                      $skip: 0
                    },
                    ids: fakeData.transactions
                      .slice(0, 10)
                      .map(i => i[state.idField]),
                    queriedAt
                  },
                  ["{\"$limit\":10,\"$skip\":10}"]: { //eslint-disable-line
                    pageParams: {
                      $limit: 10,
                      $skip: 10
                    },
                    ids: fakeData.transactions
                      .slice(10, 20)
                      .map(i => i[state.idField]),
                    queriedAt
                  }
                }
              }
            }
          }
        },
        {
          description: 'separate query, limit 10, skip 10',
          query: { test: true, $limit: 10, $skip: 10 },
          response: {
            data: fakeData.transactions.slice(10, 20),
            limit: 10,
            skip: 10,
            total: fakeData.transactions.length
          },
          makeResult(props) {
            const {
              query,
              queryId,
              queryParams,
              pageId,
              pageParams,
              queriedAt
            } = props

            return {
              defaultLimit: 10,
              defaultSkip: 0,
              'main-list': {
                mostRecent: {
                  query,
                  queryId,
                  queryParams,
                  pageId,
                  pageParams,
                  queriedAt,
                  total: 155
                },
                '{}': {
                  total: fakeData.transactions.length,
                  queryParams: {},
                  ["{\"$limit\":10,\"$skip\":0}"]: { //eslint-disable-line
                    pageParams: {
                      $limit: 10,
                      $skip: 0
                    },
                    ids: fakeData.transactions
                      .slice(0, 10)
                      .map(i => i[state.idField]),
                    queriedAt
                  },
                  ["{\"$limit\":10,\"$skip\":10}"]: { //eslint-disable-line
                    pageParams: {
                      $limit: 10,
                      $skip: 10
                    },
                    ids: fakeData.transactions
                      .slice(10, 20)
                      .map(i => i[state.idField]),
                    queriedAt
                  }
                },
                '{"test":true}': {
                  total: fakeData.transactions.length,
                  queryParams: { test: true },
                  ["{\"$limit\":10,\"$skip\":10}"]: { //eslint-disable-line
                    pageParams: {
                      $limit: 10,
                      $skip: 10
                    },
                    ids: fakeData.transactions
                      .slice(10, 20)
                      .map(i => i[state.idField]),
                    queriedAt
                  }
                }
              }
            }
          }
        }
      ]

      decisionTable.forEach(({ description, query, response, makeResult }) => {
        const { queryId, queryParams, pageId, pageParams } = getQueryInfo(
          { qid, query },
          response
        )
        const queriedAt = new Date().getTime()
        const expectedResult = makeResult({
          query,
          queryId,
          queryParams,
          pageId,
          pageParams,
          queriedAt
        })

        updatePaginationForQuery(state, { qid, response, query })

        const diff = deepDiff(
          omitDeep(state.pagination, 'queriedAt'),
          omitDeep(expectedResult, 'queriedAt')
        )

        assert.deepEqual(
          omitDeep(state.pagination, 'queriedAt'),
          omitDeep(expectedResult, 'queriedAt'),
          description
        )
      })
    })
  })

  describe('Pending', function () {
    it('setPending && unsetPending', function () {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
        assert(!state[`is${uppercaseMethod}Pending`])

        // Set pending & check
        setPending(state, method)
        assert(state[`is${uppercaseMethod}Pending`])

        // Unset pending & check
        unsetPending(state, method)
        assert(!state[`!is${uppercaseMethod}Pending`])
      })
    })
  })

  describe('Errors', function () {
    it('setError', function () {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
        setError(state, { method, error: new Error('This is a test') })
        assert(state[`errorOn${uppercaseMethod}`].message)
        assert(state[`errorOn${uppercaseMethod}`].name)
        assert(state[`errorOn${uppercaseMethod}`].stack)
      })
    })

    it('setError with feathers-errors', function () {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
        setError(state, {
          method,
          error: new errors.NotAuthenticated('You are not logged in')
        })
        assert(state[`errorOn${uppercaseMethod}`].className)
        assert(state[`errorOn${uppercaseMethod}`].code)
        assert(state[`errorOn${uppercaseMethod}`].hasOwnProperty('errors'))
        assert(state[`errorOn${uppercaseMethod}`].hasOwnProperty('data'))
        assert(state[`errorOn${uppercaseMethod}`].message)
        assert(state[`errorOn${uppercaseMethod}`].name)
        assert(state[`errorOn${uppercaseMethod}`].stack)
      })
    })

    it('clearError', function () {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)

        setError(state, { method, error: new Error('This is a test') })
        clearError(state, method)
        assert(
          state[`errorOn${uppercaseMethod}`] === null,
          `errorOn${uppercaseMethod} was cleared`
        )
      })
    })
  })
})
