import { reactive, computed, toRefs, isRef, watch } from '@vue/composition-api'
import {
  getServicePrefix,
  getServiceCapitalization,
  getQueryInfo,
  getItemsFromQueryInfo,
  Params
} from './utils'
import debounce from 'lodash/debounce'

const defaults = {
  model: null,
  params: null,
  queryWhen: () => true,
  qid: 'default'
}

export default function find(options) {
  const { model, params, name, queryWhen, qid } = Object.assign(
    {},
    defaults,
    options
  )

  const nameToUse = (name || model.servicePath).replace('-', '_')
  const prefix = getServicePrefix(nameToUse)
  const capitalized = getServiceCapitalization(nameToUse)
  const IS_FIND_PENDING = `isFind${capitalized}Pending`
  const QUERY_WHEN = `${prefix}QueryWhen`
  const FIND_ACTION = `find${capitalized}`
  const FIND_GETTER = `find${capitalized}InStore`
  const DEBOUNCED = `${FIND_ACTION}Debounced`
  const DEBOUNCE_TIME = `${FIND_ACTION}DebouncedTime`
  const HAVE_ITEMS_BEEN_REQUESTED_ONCE = `have${capitalized}BeenRequestedOnce`
  const HAVE_ITEMS_LOADED_ONCE = `have${capitalized}LoadedOnce`
  const PAGINATION = `${prefix}PaginationData`
  const MOST_RECENT_QUERY = `${prefix}LatestQuery`
  const ERROR = `${prefix}Error`
  const QID = `${prefix}Qid`

  const getFetchParams = (providedParams?:object) => {
    if (providedParams) {
      return providedParams
    } else {
      // Returning null fetchParams allows the query to be skipped.
      return options.fetchParams || options.fetchParams === null
        ? options.fetchParams
        : options.params
    }
  }

  const state = reactive({
    // The find getter
    [prefix]: computed(() => {
      // @ts-ignore
      const getterParams:Params = isRef(params) ? { ...params.value } : { params }
      if (getterParams.paginate) {
        const serviceState = model.store.state[model.servicePath]
        const { defaultSkip, defaultLimit } = serviceState.pagination
        const skip = getterParams.query.$skip || defaultSkip
        const limit = getterParams.query.$limit || defaultLimit
        const pagination = state[PAGINATION][getterParams.qid || state[QID]] || {}
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
    [QID]: qid,
    [QUERY_WHEN]: computed(() => queryWhen),
    [IS_FIND_PENDING]: false,
    [HAVE_ITEMS_BEEN_REQUESTED_ONCE]: false,
    [HAVE_ITEMS_LOADED_ONCE]: false,
    [ERROR]: null,
    [PAGINATION]: computed(() => {
      return model.store.state[model.servicePath].pagination
    }),
    [DEBOUNCED]: null,
    [DEBOUNCE_TIME]: null
  })

  function find(params) {
    params = isRef(params) ? params.value : params
    if (state[QUERY_WHEN]) {
      console.log('finding')
      state[IS_FIND_PENDING] = true
      state[HAVE_ITEMS_BEEN_REQUESTED_ONCE] = true

      model.find(params).then(response => {
        // To prevent thrashing, only clear ERROR on response, not on initial request.
        state[ERROR] = null
        state[HAVE_ITEMS_LOADED_ONCE] = true

        const queryInfo = getQueryInfo(params, response)
        queryInfo.response = response
        queryInfo.isOutdated = false

        state[MOST_RECENT_QUERY] = queryInfo
        state[IS_FIND_PENDING] = false
        return response
      })
    }
  }
  function findProxy(params?:object) {
    const paramsToUse = getFetchParams(params)

    if (paramsToUse && paramsToUse.debounce) {
      if (paramsToUse.debounce !== state[DEBOUNCE_TIME]) {
        state[DEBOUNCED] = debounce(find, paramsToUse.debounce)
        state[DEBOUNCE_TIME] = paramsToUse.debounce
      }
      return state[DEBOUNCED](paramsToUse)
    } else if (paramsToUse) {
      find(paramsToUse)
    } else {
      // Set error
    }
  }

  watch(
    () => getFetchParams(),
    () => {
      findProxy()
    }
  )

  return {
    ...toRefs(state),
    [FIND_ACTION]: model.find,
    [FIND_GETTER]: model.findInStore
  }
}
