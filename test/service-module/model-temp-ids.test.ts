/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { ServiceState } from './types'
import { assert } from 'chai'
import feathersVuex from '../../src/index'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import { clearModels } from '../../src/service-module/global-models'
import { Service as MemoryService } from 'feathers-memory'
import Vue from 'vue/dist/vue'
import Vuex from 'vuex'
import { makeStore } from '../test-utils'
import ObjectID from 'bson-objectid'
import fastCopy from 'fast-copy'

interface RootState {
  transactions: ServiceState
  things: ServiceState
}

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
    serverAlias: 'default'
  })
  class Comic extends BaseModel {
    public static modelName = 'Comic'
    public static test: boolean = true

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
        servicePath: 'comics'
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

describe('Models - Temp Ids', function() {
  beforeEach(() => {
    clearModels()
  })

  it('adds tempIds for items without an [idField]', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Transaction extends BaseModel {
      public static modelName = 'Transaction'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Transaction,
          service: feathersClient.service('transactions')
        })
      ]
    })
    const txn = new Transaction({
      description: 'Green Pasture - No More Dentists!',
      website: 'https://www.greenpasture.org',
      amount: 1.99
    })

    // Make sure we got an id.
    assert(txn.__id, 'the record got an __id')
    assert(txn.__isTemp, 'item is a temp')

    // It should be non-enumerable and non-writable
    const desc = Object.getOwnPropertyDescriptor(txn, '__id')
    assert(desc.enumerable, 'it is enumerable')
  })

  it('allows specifying the value for the tempId', function() {
    const context = makeContext()
    const Comic = context.Comic
    const oid = new ObjectID().toHexString()

    const comic = new Comic({ __id: oid })

    assert(comic.__isTemp, 'item is a temp')
    assert.equal(comic.__id, oid, 'the objectid was used')
  })

  it('adds to state.tempsById', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Transaction extends BaseModel {
      public static modelName = 'Transaction'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Transaction,
          service: feathersClient.service('transactions')
        })
      ]
    })

    const txn = new Transaction({
      description: 'Amazon - Cure Teeth Book',
      website:
        'https://www.amazon.com/Cure-Tooth-Decay-Cavities-Nutrition-ebook/dp/B004GB0JIM',
      amount: 1.99
    })

    // Make sure we got an id.
    assert(store.state.transactions.tempsById[txn.__id], 'it is in the store')
  })

  it('maintains reference to temp item after save', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Thing extends BaseModel {
      public static modelName = 'Thing'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Thing,
          service: feathersClient.service('things')
        })
      ]
    })

    // Manually set the result in a hook to simulate the server request.
    feathersClient.service('things').hooks({
      before: {
        create: [
          // Testing removing the __id and __isTemp so they're not sent to the server.
          context => {
            delete context.data.__id
            delete context.data.__isTemp
          },
          context => {
            assert(!context.data.__id, '__id was not sent to API server')
            assert(
              !context.data.__isTemp,
              '__isTemp was not sent to API server'
            )
            context.result = {
              _id: 1,
              description: 'Robb Wolf - the Paleo Solution',
              website:
                'https://robbwolf.com/shop-old/products/the-paleo-solution-the-original-human-diet/',
              amount: 1.99
            }
            return context
          }
        ]
      }
    })

    const thing = new Thing({
      description: 'Robb Wolf - the Paleo Solution',
      website:
        'https://robbwolf.com/shop-old/products/the-paleo-solution-the-original-human-diet/',
      amount: 1.99
    })

    assert(store.state.things.tempsById[thing.__id], 'item is in the tempsById')

    return thing.save().then(response => {
      assert(response._id === 1)
      assert(response.__id, 'the temp id is still intact')
      assert(!store.state.things.tempsById[response.__id])
      assert(response === thing, 'maintained the reference')
    })
  })

  it('removes uncreated temp', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Thing extends BaseModel {
      public static modelName = 'Thing'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Thing,
          service: feathersClient.service('things')
        })
      ]
    })

    const thing = new Thing({
      description: 'Robb Wolf - the Paleo Solution',
      website:
        'https://robbwolf.com/shop-old/products/the-paleo-solution-the-original-human-diet/',
      amount: 1.99
    })

    assert(store.state.things.tempsById[thing.__id], 'item is in the tempsById')

    store.commit('things/removeTemps', [thing.__id])

    assert(!store.state.things.tempsById[thing.__id], 'temp item was removed')
  })

  it('clones into Model.copiesById', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Transaction extends BaseModel {
      public static modelName = 'Transaction'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Transaction,
          service: feathersClient.service('transactions')
        })
      ]
    })
    const txn = new Transaction({
      description: 'Robb Wolf - the Paleo Solution',
      website:
        'https://robbwolf.com/shop-old/products/the-paleo-solution-the-original-human-diet/',
      amount: 1.99
    })

    txn.clone()

    assert(Transaction.copiesById[txn.__id], 'it is in the copiesById')
  })

  it('commits into store.tempsById', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Transaction extends BaseModel {
      public static modelName = 'Transaction'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Transaction,
          service: feathersClient.service('transactions')
        })
      ]
    })
    const txn = new Transaction({
      description: 'Rovit Monthly Subscription',
      website: 'https://rovit.com',
      amount: 1.99
    })

    // Clone it, change it and commit it.
    const clone = txn.clone()
    clone.amount = 11.99
    clone.commit()

    const originalTemp = store.state.transactions.tempsById[txn.__id]

    assert.equal(originalTemp.amount, 11.99, 'original was updated')
  })

  it('can reset a temp clone', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'temp-ids'
    })
    class Transaction extends BaseModel {
      public static modelName = 'Transaction'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Transaction,
          service: feathersClient.service('transactions')
        })
      ]
    })
    const txn = new Transaction({
      description: 'Rovit Monthly Subscription',
      website: 'https://rovit.com',
      amount: 1.99
    })

    // Clone it, change it and commit it.
    const clone = txn.clone()
    clone.amount = 11.99
    clone.reset()

    assert.equal(clone.amount, 1.99, 'clone was reset')
  })

  it('returns the keyedById record after create, not the tempsById record', function(done) {
    const { Comic, store } = makeContext()

    const comic = new Comic({
      name: 'The Uncanny X-Men',
      year: 1969
    })

    // Create a temp and make sure it's in the tempsById
    const tempId = comic.__id
    // @ts-ignore
    assert(store.state.comics.tempsById[tempId])
    assert(comic.__isTemp)

    comic
      .save()
      .then(response => {
        assert(!response.hasOwnProperty('__isTemp'))
        // The comic record is no longer in tempsById
        // @ts-ignore
        assert(!store.state.comics.tempsById[tempId], 'temp is gone')
        // The comic record moved to keyedById
        // @ts-ignore
        assert(store.state.comics.keyedById[response.id], 'now a real record')
        done()
      })
      .catch(done)
  })

  it('removes __isTemp from temp and clone', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Thing extends BaseModel {
      public static modelName = 'Thing'
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Thing,
          service: feathersClient.service('things')
        })
      ]
    })

    const thing = new Thing()
    assert(thing.__isTemp, 'thing has __isTemp')

    const clone = thing.clone()
    assert(clone.__isTemp, 'Clone also has __isTemp')

    store.commit('things/updateTemp', { id: 42, tempId: thing.__id })

    assert(!thing.hasOwnProperty('__isTemp'), '__isTemp was removed from thing')
    assert(!clone.hasOwnProperty('__isTemp'), '__isTemp was removed from clone')
  })

  it('updateTemp assigns ID to temp and migrates it from tempsById to keyedById', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Thing extends BaseModel {
      public static modelName = 'Thing'
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Thing,
          service: feathersClient.service('things')
        })
      ]
    })

    const thing = new Thing()
    assert(thing.__id, 'thing has tempId')
    assert(!thing._id, 'thing does not have _id')
    assert(store.state.things.tempsById[thing.__id], 'thing is in tempsById')

    store.commit('things/updateTemp', { id: 42, tempId: thing.__id })
    assert(thing._id === 42, 'thing got _id')
    assert(store.state.things.keyedById[42] === thing, 'thing is in keyedById')
    assert(
      !store.state.things.tempsById[thing.__id],
      'thing is no longer in tempsById'
    )
  })

  it('Clone gets _id after save (create only called once)', async function() {
    // Test ensures subsequent calls to clone.save() do not call create
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class Thing extends BaseModel {
      public static modelName = 'Thing'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: Thing,
          service: feathersClient.service('things')
        })
      ]
    })

    // Manually set the result in a hook to simulate the server request.
    let createCalled = false
    feathersClient.service('things').hooks({
      before: {
        create: [
          context => {
            assert(createCalled === false, 'Create is only called once')
            createCalled = true
            context.result = { _id: 42, ...context.data }
            return context
          }
        ],
        patch: [
          context => {
            assert(context.data.__isClone, 'Patch called on clone')
            assert(context.id === 42, 'context has correct ID')
            assert(context.data._id === 42, 'patch called with correct _id')
            assert(
              context.data.description === 'Thing 3',
              'patch called with correct description'
            )
            context.result = { ...context.data }
            return context
          }
        ]
      }
    })

    // Create instance and clone
    const thing = new Thing({ description: 'Thing 1' })
    const clone = thing.clone()
    assert(thing.__id === clone.__id, "clone has thing's tempId")
    assert(clone.description === 'Thing 1', "clone got thing's description")
    assert(!thing.hasOwnProperty('_id'), 'thing has no _id')
    assert(!clone.hasOwnProperty('_id'), 'clone has no _id')

    // Modify clone and save
    clone.description = 'Thing 2'
    const response = await clone.save()
    assert(response === thing, 'response from clone.save() is thing')
    assert(thing._id === 42, 'thing got _id')
    assert(thing.description === 'Thing 2', "thing got clone's changes")
    assert(clone._id === response._id, 'clone got _id')

    // Modify clone again and save again
    clone.description = 'Thing 3'
    const response2 = await clone.save()
    assert(response2 === thing, 'response2 is still thing')
    assert(thing.description === 'Thing 3', "thing got clone's new changes")
  })

  it('find() getter does not return duplicates with temps: true', async function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })
    class FooModel extends BaseModel {
      public static modelName = 'FooModel'
      public constructor(data?, options?) {
        super(data, options)
      }
    }
    const store = new Vuex.Store<RootState>({
      plugins: [
        makeServicePlugin({
          Model: FooModel,
          service: feathersClient.service('foos'),
          servicePath: 'foos'
        })
      ]
    })

    // Fake server call
    feathersClient.service('foos').hooks({
      before: {
        create: [
          context => {
            delete context.data.__id
            delete context.data.__isTemp
          },
          context => {
            context.result = { _id: 24, ...context.data }
            return context
          }
        ]
      }
    })

    // Create component with find() computed prop
    const watchEvents = []
    new Vue({
      template: `<div></div>`,
      computed: {
        things() {
          return store.getters['foos/find']({
            query: { test: true },
            temps: true
          }).data
        }
      },
      watch: {
        things(items) {
          watchEvents.push(fastCopy(items))
        }
      }
    }).$mount()

    const item = new FooModel({ test: true })
    await item.save()

    assert(watchEvents.length > 0, 'watch fired at least once')
    watchEvents.forEach(items => {
      if (items.length === 2) {
        assert(items[0]._id !== items[1]._id, 'no duplicate id')
        assert(items[0].__id !== items[1].__id, 'no duplicate tempId')
      }
    })
  })
})

// Disable readonly models in test
declare module '../../src' {
  interface FeathersVuexTypeOptions {
    'model-readonly': false
  }
}
