import { reactive, computed, toRefs, watch } from '@vue/composition-api'
import {
  getServicePrefix,
  getServiceCapitalization,
  getQueryInfo,
  getItemsFromQueryInfo
} from './utils'

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
  const GET_ACTION = `find${capitalized}`
  const GET_GETTER = `find${capitalized}InStore`
  const HAVE_ITEMS_BEEN_REQUESTED_ONCE = `have${capitalized}BeenRequestedOnce`
  const HAVE_ITEMS_LOADED_ONCE = `have${capitalized}LoadedOnce`
  const PAGINATION = `${prefix}PaginationData`
  // const MOST_RECENT_QUERY = `${prefix}LatestQuery`
  const ERROR = `${prefix}Error`

  const state = reactive({
    [prefix]: computed(() => model.getFromStore(params).data),
    [IS_FIND_PENDING]: false,
    [HAVE_ITEMS_BEEN_REQUESTED_ONCE]: false,
    [HAVE_ITEMS_LOADED_ONCE]: false,
    [ERROR]: null,
    [PAGINATION]: computed(() => {
      return model.store.state[model.servicePath].pagination
    })
  })
  function get(params) {
    if (params != null) {
      console.log('finding')
      model.get(params)
    }
  }

  watch(
    () => params,
    params => {
      get(params)
    }
  )

  get(params)

  return {
    ...toRefs(state),
    [GET_ACTION]: model.get,
    [GET_GETTER]: model.getFromStore
  }
}
