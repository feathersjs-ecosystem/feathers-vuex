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
import { computed, isRef } from 'vue-demi'
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

describe.only('use/find', function () {
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

    assert(isRef(debounceTime))
    assert(debounceTime.value === null)

    assert(isRef(error))
    assert(error.value === null)

    assert(isRef(haveBeenRequested))
    assert(haveBeenRequested.value === true)

    assert(isRef(haveLoaded))
    assert(haveLoaded.value === false)

    assert(isRef(isPending))
    assert(isPending.value === true)

    assert(isRef(isLocal))
    assert(isLocal.value === false)

    assert(isRef(items))
    assert(Array.isArray(items.value))
    assert(items.value.length === 0)

    assert(isRef(latestQuery))
    assert(latestQuery.value === null)

    assert(isRef(paginationData))
    assert.deepStrictEqual(paginationData.value, {
      defaultLimit: null,
      defaultSkip: null,
    })

    assert(isRef(qid))
    assert(qid.value === 'default')
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

    assert(isRef(debounceTime))
    assert(debounceTime.value === null)

    assert(isRef(error))
    assert(error.value === null)

    assert(isRef(haveBeenRequested))
    assert(haveBeenRequested.value === true)

    assert(isRef(haveLoaded))
    assert(haveLoaded.value === false)

    assert(isRef(isPending))
    assert(isPending.value === true)

    assert(isRef(isLocal))
    assert(isLocal.value === false)

    assert(isRef(items))
    assert(Array.isArray(items.value))
    assert(items.value.length === 0)

    assert(isRef(latestQuery))
    assert(latestQuery.value === null)

    assert(isRef(paginationData))
    assert.deepStrictEqual(paginationData.value, {
      defaultLimit: null,
      defaultSkip: null,
    })

    assert(isRef(qid))
    assert(qid.value === 'default')
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

    assert(isRef(haveBeenRequested))
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

    assert(isRef(haveBeenRequested))
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

    assert(isRef(haveBeenRequested))
    assert(haveBeenRequested.value === false, 'no request during init')

    find()

    assert(haveBeenRequested.value === false, 'no request after find')
  })
})
