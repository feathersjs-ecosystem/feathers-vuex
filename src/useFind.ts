/*
eslint
@typescript-eslint/no-explicit-any: 0
*/
import {
  computed,
  isRef,
  reactive,
  Ref,
  toRefs,
  watch
} from '@vue/composition-api'
import debounce from 'lodash/debounce'
import { getItemsFromQueryInfo, getQueryInfo, Params } from './utils'

interface UseFindOptions {
  model: Function
  params: Params | Ref<Params>
  fetchParams?: Params | Ref<Params>
  queryWhen?: Ref<Function>
  qid?: string
  local?: boolean
  lazy?: boolean
}
interface UseFindState {
  debounceTime: null | number
  qid: string
  isPending: boolean
  haveBeenRequested: boolean
  haveLoaded: boolean
  error: null | Error
  latestQuery: null | object
  isLocal: boolean
}
interface UseFindData {
  items: Ref<any>
  servicePath: Ref<string>
  isPending: Ref<boolean>
  haveBeenRequested: Ref<boolean>
  haveLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  qid: Ref<string>
  debounceTime: Ref<number>
  latestQuery: Ref<object>
  paginationData: Ref<object>
  error: Ref<Error>
  find: Function
}

const unwrapParams = (params: Params | Ref<Params>): Params =>
  isRef(params) ? params.value : params

export default function find(options: UseFindOptions): UseFindData {
  const defaults = {
    model: null,
    params: null,
    qid: 'default',
    queryWhen: computed((): boolean => true),
    local: false,
    lazy: false
  }
  const { model, params, queryWhen, qid, local, lazy } = Object.assign(
    {},
    defaults,
    options
  )

  const getFetchParams = (providedParams?: Params | Ref<Params>): Params => {
    const provided = unwrapParams(providedParams)

    if (provided) {
      return provided
    }

    const fetchParams = unwrapParams(options.fetchParams)
    // Returning null fetchParams allows the query to be skipped.
    if (fetchParams || fetchParams === null) {
      return fetchParams
    }

    const params = unwrapParams(options.params)
    return params
  }

  const state = reactive<UseFindState>({
    qid,
    isPending: false,
    haveBeenRequested: false,
    haveLoaded: false,
    error: null,
    debounceTime: null,
    latestQuery: null,
    isLocal: local
  })
  const computes = {
    // The find getter
    items: computed<any[]>(() => {
      const getterParams = unwrapParams(params)

      if (getterParams && getterParams.paginate) {
        const serviceState = model.store.state[model.servicePath]
        const { defaultSkip, defaultLimit } = serviceState.pagination
        const skip = getterParams.query.$skip || defaultSkip
        const limit = getterParams.query.$limit || defaultLimit
        const pagination =
          computes.paginationData.value[getterParams.qid || state.qid] || {}
        const response = skip != null && limit != null ? { limit, skip } : {}
        const queryInfo = getQueryInfo(getterParams, response)
        const items = getItemsFromQueryInfo(
          pagination,
          queryInfo,
          serviceState.keyedById
        )
        return items
      } else {
        return model.findInStore(getterParams).data
      }
    }),
    paginationData: computed(() => {
      return model.store.state[model.servicePath].pagination
    }),
    servicePath: computed<string>(() => model.servicePath)
  }

  function find<T>(params: Params | Ref<Params>): T {
    params = unwrapParams(params)
    if (queryWhen.value && !state.isLocal) {
      state.isPending = true
      state.haveBeenRequested = true

      return model.find(params).then(response => {
        // To prevent thrashing, only clear error on response, not on initial request.
        state.error = null
        state.haveLoaded = true

        const queryInfo = getQueryInfo(params, response)
        queryInfo.response = response
        queryInfo.isOutdated = false

        state.latestQuery = queryInfo
        state.isPending = false
        return response
      })
    }
  }
  const methods = {
    findDebounced<Promise>(params?: Params): Promise {
      return find(params)
    }
  }
  function findProxy<T>(params?: Params | Ref<Params>): T {
    const paramsToUse = getFetchParams(params)

    if (paramsToUse && paramsToUse.debounce) {
      if (paramsToUse.debounce !== state.debounceTime) {
        methods.findDebounced = debounce(find, paramsToUse.debounce)
        state.debounceTime = paramsToUse.debounce
      }
      return methods.findDebounced(paramsToUse)
    } else if (paramsToUse) {
      return find(paramsToUse)
    } else {
      // Set error
    }
  }

  watch(
    () => getFetchParams(),
    () => {
      findProxy()
    },
    { lazy }
  )

  return {
    ...computes,
    ...toRefs(state),
    find
  }
}
