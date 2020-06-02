/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0,
@typescript-eslint/no-empty-function: 0
*/
import Vue from 'vue'
import VueCompositionApi from 'vue'
Vue.use(VueCompositionApi)

import jsdom from 'jsdom-global'
import { assert } from 'chai'
import feathersVuex, { FeathersVuex } from '../../src/index'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import useGet from '../../src/useGet'
import memory from 'feathers-memory'
import Vuex from 'vuex'
import { mount, shallowMount } from '@vue/test-utils'
import InstrumentComponent from './InstrumentComponent'
import { computed, isRef } from 'vue'
import { HookContext } from '@feathersjs/feathers'
jsdom()
require('events').EventEmitter.prototype._maxListeners = 100

Vue.use(Vuex)
Vue.use(FeathersVuex)

function timeoutPromise(wait = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, wait)
  })
}

function makeContext() {
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'useGet'
  })

  class Instrument extends BaseModel {
    public constructor(data, options?) {
      super(data, options)
    }
    public static modelName = 'Instrument'
    public static instanceDefaults(data) {
      return {
        name: ''
      }
    }
  }

  feathersClient.use(
    'instruments',
    memory({
      store: {
        0: { id: 0, name: 'trumpet' },
        1: { id: 1, name: 'trombone' }
      },
      paginate: {
        default: 10,
        max: 50
      }
    })
  )

  const servicePath = 'instruments'
  const store = new Vuex.Store({
    plugins: [
      makeServicePlugin({
        Model: Instrument,
        servicePath,
        service: feathersClient.service(servicePath)
      })
    ]
  })
  return { store, Instrument, BaseModel, makeServicePlugin }
}

describe('use/get', function () {
  it('returns correct default data', function () {
    const { Instrument } = makeContext()

    const id = 1

    const existing = Instrument.getFromStore(id)
    assert(!existing, 'the current instrument is not in the store.')

    const instrumentData = useGet({ model: Instrument, id })

    const {
      error,
      hasBeenRequested,
      hasLoaded,
      isPending,
      isLocal,
      item
    } = instrumentData

    assert(isRef(error))
    assert(error.value === null)

    assert(isRef(hasBeenRequested))
    assert(hasBeenRequested.value === true)

    assert(isRef(hasLoaded))
    assert(hasLoaded.value === false)

    assert(isRef(isPending))
    assert(isPending.value === true)

    assert(isRef(isLocal))
    assert(isLocal.value === false)

    assert(isRef(item))
    assert(item.value === null)
  })

  it('allows passing {lazy:true} to not query immediately', function () {
    const { Instrument } = makeContext()

    const id = 1
    const instrumentData = useGet({ model: Instrument, id, lazy: true })
    const { hasBeenRequested } = instrumentData

    assert(isRef(hasBeenRequested))
    assert(hasBeenRequested.value === false)
  })

  it('id can return null id to prevent the query', function () {
    const { Instrument } = makeContext()

    const id = null
    const instrumentData = useGet({ model: Instrument, id })
    const { hasBeenRequested } = instrumentData

    assert(isRef(hasBeenRequested))
    assert(hasBeenRequested.value === false)
  })

  it('allows using `local: true` to prevent API calls from being made', function () {
    const { Instrument } = makeContext()

    const id = 1
    const instrumentData = useGet({ model: Instrument, id, local: true })
    const { hasBeenRequested, get } = instrumentData

    assert(isRef(hasBeenRequested))
    assert(hasBeenRequested.value === false, 'no request during init')

    get()

    assert(hasBeenRequested.value === false, 'no request after get')
  })

  it('API only hit once on initial render', async function() {
    const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
      serverAlias: 'useGet'
    })

    class Dohickey extends BaseModel {
      public static modelName = 'Dohickey'
    }

    const servicePath = 'dohickies'
    const store = new Vuex.Store({
      plugins: [
        makeServicePlugin({
          Model: Dohickey,
          servicePath,
          service: feathersClient.service(servicePath)
        })
      ]
    })

    let getCalls = 0
    feathersClient.service(servicePath).hooks({
      before: {
        get: [
          (ctx: HookContext) => {
            getCalls += 1
            ctx.result = { id: ctx.id }
          }
        ]
      }
    })

    useGet({ model: Dohickey, id: 42 })
    await new Promise(resolve => setTimeout(resolve, 100))

    assert(getCalls === 1, '`get` called once')
  })
})
