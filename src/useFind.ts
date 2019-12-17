/*
eslint
@typescript-eslint/no-explicit-any: 0
*/
import {
  reactive,
  computed,
  toRefs,
  isRef,
  watch,
  Ref
} from '@vue/composition-api'
import { getQueryInfo, getItemsFromQueryInfo, Params } from './utils'
import debounce from 'lodash/debounce'

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
  isFindPending: boolean
  haveBeenRequestedOnce: boolean
  haveLoadedOnce: boolean
  error: null | Error
  latestQuery: null | object
  isLocal: boolean
}
interface UseFindData {
  items: Ref<any>
  servicePath: Ref<string>
  isFindPending: Ref<boolean>
  haveBeenRequestedOnce: Ref<boolean>
  haveLoadedOnce: Ref<boolean>
  isLocal: Ref<boolean>
  qid: Ref<string>
  debounceTime: Ref<number>
  latestQuery: Ref<object>
  paginationData: Ref<object>
  error: Ref<Error>
  find: Function
}

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

  const getFetchParams = (providedParams?: object): Params => {
    const provided = isRef(providedParams)
      ? providedParams.value
      : providedParams

    if (provided) {
      return provided
    } else {
      const fetchParams = isRef(options.fetchParams)
        ? options.fetchParams.value
        : options.fetchParams
      const params = isRef(options.params)
        ? options.params.value
        : options.params

      // Returning null fetchParams allows the query to be skipped.
      return fetchParams || fetchParams === null ? fetchParams : params
    }
  }

  const state = reactive<UseFindState>({
    qid,
    isFindPending: false,
    haveBeenRequestedOnce: false,
    haveLoadedOnce: false,
    error: null,
    debounceTime: null,
    latestQuery: null,
    isLocal: local
  })
  const computes = {
    // The find getter
    items: computed<any[]>(() => {
      const getterParams: Params = isRef(params)
        ? Object.assign({}, params.value)
        : { params }
      if (getterParams.paginate) {
        const serviceState = model.store.state[model.servicePath]
        const { defaultSkip, defaultLimit } = serviceState.pagination
        const skip = getterParams.query.$skip || defaultSkip
        const limit = getterParams.query.$limit || defaultLimit
        const pagination =
          computes.paginationData[getterParams.qid || state[qid]] || {}
        const response = skip != null && limit != null ? { limit, skip } : {}
        const queryInfo = getQueryInfo(getterParams, response)
        const items = getItemsFromQueryInfo(
          pagination,
          queryInfo,
          serviceState.keyedById
        )
        if (items && items.length) {
          return items
        }
      } else {
        return model.findInStore(getterParams).data
      }
    }),
    paginationData: computed(() => {
      return model.store.state[model.servicePath].pagination
    }),
    servicePath: computed<string>(() => model.servicePath)
  }

  function find<T>(params: Params): T {
    params = isRef(params) ? params.value : params
    if (queryWhen.value && !state.isLocal) {
      state.isFindPending = true
      state.haveBeenRequestedOnce = true

      return model.find(params).then(response => {
        // To prevent thrashing, only clear error on response, not on initial request.
        state.error = null
        state.haveLoadedOnce = true

        const queryInfo = getQueryInfo(params, response)
        queryInfo.response = response
        queryInfo.isOutdated = false

        state.latestQuery = queryInfo
        state.isFindPending = false
        return response
      })
    }
  }
  const methods = {
    findDebounced<Promise>(params?: Params): Promise {
      return find(params)
    }
  }
  function findProxy<T>(params?: Params): T {
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
