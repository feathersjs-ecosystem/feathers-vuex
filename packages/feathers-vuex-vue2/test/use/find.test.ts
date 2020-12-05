/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0,
@typescript-eslint/no-empty-function: 0
*/
import Vue from 'vue'
import jsdom from 'jsdom-global'
import { assert } from 'chai'
import feathersVuex, { FeathersVuex } from '../../src/index'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import { useFind } from '@feathersjs/vuex-commons'
import Vuex from 'vuex'
// import { shallowMount } from '@vue/test-utils'
import { computed } from 'vue-demi'
jsdom()
require('events').EventEmitter.prototype._maxListeners = 100

Vue.use(Vuex)
Vue.use(FeathersVuex)

function makeContext() {
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'useFind',
  })

  class Instrument extends BaseModel {
    public static modelName = 'Instrument'
  }

  const serviceName = 'instruments'
  const store = new Vuex.Store({
    plugins: [
      makeServicePlugin({
        Model: Instrument,
        service: feathersClient.service(serviceName),
      }),
    ],
  })
  return { store, Instrument, BaseModel, makeServicePlugin }
}

describe('use/find', function () {
  it('returns correct default data', function () {
    const { Instrument } = makeContext()

    const instrumentParams = computed(() => {
      return {
        query: {},
        paginate: false,
      }
    })
    const instrumentsData = useFind({
      model: Instrument,
      params: instrumentParams,
    })

    const {
      debounceTime,
      error,
      haveBeenRequested,
      haveLoaded,
      isPending,
      isLocal,
      items,
      latestQuery,
      paginationData,
      qid,
    } = instrumentsData

    assert.strictEqual(debounceTime.value, null)
    assert.strictEqual(error.value, null)
    assert.strictEqual(haveBeenRequested.value, true)
    assert.strictEqual(haveLoaded.value, false)
    assert.strictEqual(isPending.value, true)
    assert.strictEqual(isLocal.value, false)
    assert.strictEqual(Array.isArray(items.value), true)
    assert.strictEqual(items.value.length, 0)
    assert.strictEqual(latestQuery.value, null)
    assert.strictEqual(qid.value, 'default')

    assert.deepStrictEqual(paginationData.value, {
      defaultLimit: null,
      defaultSkip: null,
    })
  })

  it('returns correct default data even when params is not reactive', function () {
    const { Instrument } = makeContext()

    const instrumentsData = useFind({
      model: Instrument,
      params: {
        query: {},
        paginate: false,
      },
    })

    const {
      debounceTime,
      error,
      haveBeenRequested,
      haveLoaded,
      isPending,
      isLocal,
      items,
      latestQuery,
      paginationData,
      qid,
    } = instrumentsData

    assert.strictEqual(debounceTime.value, null)
    assert.strictEqual(error.value, null)
    assert.strictEqual(haveBeenRequested.value, true)
    assert.strictEqual(haveLoaded.value, false)
    assert.strictEqual(isPending.value, true)
    assert.strictEqual(isLocal.value, false)
    assert.strictEqual(Array.isArray(items.value), true)
    assert.strictEqual(items.value.length, 0)
    assert.strictEqual(latestQuery.value, null)
    assert.strictEqual(qid.value, 'default')

    assert.deepStrictEqual(paginationData.value, {
      defaultLimit: null,
      defaultSkip: null,
    })
  })

  it('allows passing {immediate:false} to not query immediately', function () {
    const { Instrument } = makeContext()

    const instrumentParams = computed(() => {
      return {
        query: {},
        paginate: false,
      }
    })
    const instrumentsData = useFind({
      model: Instrument,
      params: instrumentParams,
      immediate: false,
    })
    const { haveBeenRequested } = instrumentsData

    assert(haveBeenRequested.value === false)
  })

  it('params can return null to prevent the query', function () {
    const { Instrument } = makeContext()

    const instrumentParams = computed(() => {
      return null
    })
    const instrumentsData = useFind({
      model: Instrument,
      params: instrumentParams,
      immediate: true,
    })
    const { haveBeenRequested } = instrumentsData

    assert(haveBeenRequested.value === false)
  })

  it('allows using `local: true` to prevent API calls from being made', function () {
    const { Instrument } = makeContext()

    const instrumentParams = computed(() => {
      return {
        query: {},
      }
    })
    const instrumentsData = useFind({
      model: Instrument,
      params: instrumentParams,
      local: true,
    })
    const { haveBeenRequested, find } = instrumentsData

    assert(haveBeenRequested.value === false, 'no request during init')

    find()

    assert(haveBeenRequested.value === false, 'no request after find')
  })
})
