/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0,
@typescript-eslint/no-empty-function: 0
*/
import jsdom from 'jsdom-global'
import { assert } from 'chai'
import feathersVuex, { FeathersVuex } from '../../src/index'
import { feathersRestClient as feathersClient } from '../fixtures/feathers-client'
import useFind from '../../src/useFind'
import Vue from 'vue/dist/vue'
import VueCompositionApi from '@vue/composition-api'
import Vuex from 'vuex'
// import { shallowMount } from '@vue/test-utils'
import { computed, isRef } from '@vue/composition-api'
jsdom()
require('events').EventEmitter.prototype._maxListeners = 100

function makeContext() {
  const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
    serverAlias: 'make-find-mixin'
  })

  class Instrument extends BaseModel {
    public static modelName = 'Instrument'
  }

  const serviceName = 'instruments'
  const store = new Vuex.Store({
    plugins: [
      makeServicePlugin({
        Model: Instrument,
        service: feathersClient.service(serviceName)
      })
    ]
  })
  return { store, Instrument, BaseModel, makeServicePlugin }
}

Vue.use(VueCompositionApi)
Vue.use(Vuex)
Vue.use(FeathersVuex)

describe('use/find', function() {
  it('returns correct default data', function() {
    const { Instrument } = makeContext()

    const instrumentParams = computed(() => {
      return {
        query: {},
        paginate: false
      }
    })
    const instrumentsData = useFind({
      model: Instrument,
      params: instrumentParams
    })

    const {
      debounceTime,
      error,
      find,
      findInStore,
      haveBeenRequestedOnce,
      haveLoadedOnce,
      isFindPending,
      isLocal,
      items,
      latestQuery,
      paginationData,
      qid,
      queryWhen
    } = instrumentsData

    assert(isRef(debounceTime))
    assert(debounceTime.value === null)

    assert(isRef(error))
    assert(error.value === null)

    assert(typeof find === 'function')
    assert(typeof findInStore === 'function')

    assert(isRef(haveBeenRequestedOnce))
    assert(haveBeenRequestedOnce.value === true)

    assert(isRef(haveLoadedOnce))
    assert(haveLoadedOnce.value === false)

    assert(isRef(isFindPending))
    assert(isFindPending.value === true)

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
      defaultSkip: null
    })

    assert(isRef(qid))
    assert(qid.value === 'default')

    assert(isRef(queryWhen))
    assert(queryWhen.value === true)
  })

  it.skip('allows passing {lazy:true} to not query immediately', function() {})
})
