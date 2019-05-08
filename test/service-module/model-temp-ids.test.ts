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
import memory from 'feathers-memory'
import Vuex from 'vuex'
import { makeStore } from '../test-utils'
import ObjectID from 'bson-objectid'

interface RootState {
  transactions: ServiceState
}

class ComicService extends memory.Service {
  public create(data, params, callback) {
    return super.create(data, params, callback).then(response => {
      delete response.__id
      delete response.__isTemp
      return response
    })
  }
  public update(id, data, params, callback) {
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

describe('Models - Temp Ids', function () {
  beforeEach(() => {
    clearModels()
  })

  it('adds tempIds for items without an [idField]', function () {
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

  it('allows specifying the value for the tempId', function () {
    const context = makeContext()
    const Comic = context.Comic
    const oid = new ObjectID().toHexString()

    const comic = new Comic({ __id: oid })

    assert(comic.__isTemp, 'item is a temp')
    assert.equal(comic.__id, oid, 'the objectid was used')
  })

  it('adds to state.tempsById', function () {
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

  it('clones into Model.copiesById', function () {
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

  it('commits into store.tempsById', function () {
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

  it('can reset a temp clone', function () {
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

  it('returns the keyedById record after create, not the tempsById record', function (done) {
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
})
