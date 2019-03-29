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
import Vuex from 'vuex'

interface RootState {
  transactions: ServiceState
}

describe('Models - Default Values', function() {
  beforeEach(() => {
    clearModels()
  })

  it('adds tempIds for items without an [idField]', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })

    class Transaction extends BaseModel {
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

    // It should be non-enumerable and non-writable
    const desc = Object.getOwnPropertyDescriptor(txn, '__id')
    assert(desc.enumerable, 'it is enumerable')
  })

  it('adds to state.tempsById', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })

    class Transaction extends BaseModel {
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

  it('clones into Model.copiesById', function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      idField: '_id',
      serverAlias: 'temp-ids'
    })

    class Transaction extends BaseModel {
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

    // Make sure we got an id.
    assert(Transaction.copiesById[txn.__id], 'it is in the copiesById')
  })
})
