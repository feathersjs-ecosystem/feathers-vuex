/*
eslint
no-console: 0,
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import {
  getServicePrefix,
  getServiceCapitalization,
  getQueryInfo,
  getItemsFromQueryInfo
} from './utils'
import debounce from 'lodash/debounce'
import _get from 'lodash/get'

export default function makeFindMixin(options) {
  const {
    service,
    params,
    fetchQuery,
    queryWhen = () => true,
    local = false,
    qid = 'default',
    items,
    debug
  } = options
  let { name, watch = [] } = options

  if (typeof watch === 'string') {
    watch = [watch]
  } else if (typeof watch === 'boolean' && watch) {
    watch = ['params']
  }

  if (
    !service ||
    (typeof service !== 'string' && typeof service !== 'function')
  ) {
    throw new Error(
      `The 'service' option is required in the FeathersVuex make-find-mixin and must be a string.`
    )
  }
  if (typeof service === 'function' && !name) {
    name = 'service'
  }

  const nameToUse = (name || service).replace('-', '_')
  const prefix = getServicePrefix(nameToUse)
  const capitalized = getServiceCapitalization(nameToUse)
  const SERVICE_NAME = `${prefix}ServiceName`
  let ITEMS = items || prefix
  if (typeof service === 'function' && name === 'service' && !items) {
    ITEMS = 'items'
  }
  const ITEMS_FETCHED = `${ITEMS}Fetched`
  const IS_FIND_PENDING = `isFind${capitalized}Pending`
  const PARAMS = `${prefix}Params`
  const FETCH_PARAMS = `${prefix}FetchParams`
  const WATCH = `${prefix}Watch`
  const QUERY_WHEN = `${prefix}QueryWhen`
  const ERROR = `${prefix}Error`
  const FIND_ACTION = `find${capitalized}`
  const FIND_GETTER = `find${capitalized}InStore`
  const HAVE_ITEMS_BEEN_REQUESTED_ONCE = `have${capitalized}BeenRequestedOnce`
  const HAVE_ITEMS_LOADED_ONCE = `have${capitalized}LoadedOnce`
  const PAGINATION = `${prefix}PaginationData`
  const MOST_RECENT_QUERY = `${prefix}LatestQuery`
  const LOCAL = `${prefix}Local`
  const QID = `${prefix}Qid`
  const data = {
    [IS_FIND_PENDING]: false,
    [HAVE_ITEMS_BEEN_REQUESTED_ONCE]: false,
    [HAVE_ITEMS_LOADED_ONCE]: false,
    [WATCH]: watch,
    [QID]: qid,
    [MOST_RECENT_QUERY]: null,
    [ERROR]: null
  }
  // Should only be used with actual fetching API calls.
  const getParams = ({ providedParams, params, fetchParams }) => {
    if (providedParams) {
      return providedParams
    } else {
      // Returning null fetchParams allows the query to be skipped.
      return fetchParams || fetchParams === null ? fetchParams : params
    }
  }

  const mixin = {
    data() {
      return data
    },
    computed: {
      [PAGINATION]() {
        return this.$store.state[this[SERVICE_NAME]].pagination
      },
      [ITEMS]() {
        const serviceName = this[SERVICE_NAME]
        const serviceState = this.$store.state[serviceName]

        // If both queries are provided, we're not using fall-through pagination.
        if (
          (this[FETCH_PARAMS] && this[PARAMS]) ||
          (this[PARAMS] && !this[PARAMS].paginate)
        ) {
          return this.$store.getters[`${serviceName}/find`](this[PARAMS]).data
        }

        // User can pass `paginate: true` to force pagination.
        const params = this[PARAMS]
        // Check for pagination data for this query.
        if (params) {
          const { defaultSkip, defaultLimit } = serviceState.pagination
          const skip = params.query.$skip || defaultSkip
          const limit = params.query.$limit || defaultLimit
          const pagination = this[PAGINATION][params.qid || this[QID]] || {}
          const response = skip != null && limit != null ? { limit, skip } : {}
          const queryInfo = getQueryInfo(params, response)
          const items = getItemsFromQueryInfo(
            pagination,
            queryInfo,
            serviceState.keyedById
          )

          if (items && items.length) {
            return items
          }
        }

        return []
      },
      // Queries the Vuex store with the exact same query that was sent to the API server.
      [ITEMS_FETCHED]() {
        if (this[FETCH_PARAMS]) {
          return this[FIND_GETTER](this[FETCH_PARAMS]).data
        } else {
          return this[ITEMS]
        }
      },
      // Exposes `findItemsInStore
      [FIND_GETTER]() {
        return params => {
          const serviceName = this[SERVICE_NAME]
          return this.$store.getters[`${serviceName}/find`](params)
        }
      }
    },
    methods: {
      [`${FIND_ACTION}DebouncedProxy`](params) {
        const paramsToUse = getParams({
          providedParams: params,
          params: this[PARAMS],
          fetchParams: this[FETCH_PARAMS]
        })
        if (paramsToUse && paramsToUse.debounce) {
          const cachedDebounceFunction = this[`${FIND_ACTION}Debounced`]
          const mostRecentTime = this[`${FIND_ACTION}MostRecentDebounceTime`]

          if (
            !cachedDebounceFunction ||
            mostRecentTime != paramsToUse.debounce
          ) {
            this[`${FIND_ACTION}MostRecentDebounceTime`] = paramsToUse.debounce
            this[`${FIND_ACTION}Debounced`] = debounce(
              this[FIND_ACTION],
              paramsToUse.debounce
            )
          }
          return this[`${FIND_ACTION}Debounced`](paramsToUse)
        } else {
          return this[FIND_ACTION](paramsToUse)
        }
      },
      [FIND_ACTION](params) {
        const serviceName = this[SERVICE_NAME]
        const paramsToUse = getParams({
          providedParams: params,
          params: this[PARAMS],
          fetchParams: this[FETCH_PARAMS]
        })

        if (!this[LOCAL]) {
          const shouldExecuteQuery =
            typeof this[QUERY_WHEN] === 'function'
              ? this[QUERY_WHEN](paramsToUse)
              : this[QUERY_WHEN]

          if (shouldExecuteQuery) {
            if (paramsToUse) {
              // Set the qid.
              paramsToUse.query = paramsToUse.query || {}
              paramsToUse.qid = paramsToUse.qid || this[QID]
              this[QID] = paramsToUse.qid

              this[IS_FIND_PENDING] = true
              this[HAVE_ITEMS_BEEN_REQUESTED_ONCE] = true

              return this.$store
                .dispatch(`${serviceName}/find`, paramsToUse)
                .then(response => {
                  // To prevent thrashing, only clear ERROR on response, not on initial request.
                  this[ERROR] = null

                  this[HAVE_ITEMS_LOADED_ONCE] = true
                  const queryInfo = getQueryInfo(paramsToUse, response)
                  queryInfo.response = response
                  queryInfo.isOutdated = false

                  this[MOST_RECENT_QUERY] = queryInfo
                  this[IS_FIND_PENDING] = false
                  return response
                })
                .catch(error => {
                  this[ERROR] = error
                  return error
                })
            }
          } else {
            if (this[MOST_RECENT_QUERY]) {
              this[MOST_RECENT_QUERY].isOutdated = true
            }
          }
        }
      },
      getPaginationForQuery(params = {}) {
        const pagination = this[PAGINATION]
        const { qid, queryId, pageId } = getQueryInfo(params)
        const queryInfo = _get(pagination, `[${qid}][${queryId}]`) || {}
        const pageInfo =
          _get(pagination, `[${qid}][${queryId}][${pageId}]`) || {}

        return { queryInfo, pageInfo }
      }
    },
    created() {
      debug &&
        console.log(
          `running 'created' hook in makeFindMixin for service "${service}" (using name ${nameToUse}")`
        )
      debug && console.log(PARAMS, this[PARAMS])
      debug && console.log(FETCH_PARAMS, this[FETCH_PARAMS])

      const pType = Object.getPrototypeOf(this)

      if (pType.hasOwnProperty(PARAMS) || pType.hasOwnProperty(FETCH_PARAMS)) {
        watch.forEach(prop => {
          if (typeof prop !== 'string') {
            throw new Error(`Values in the 'watch' array must be strings.`)
          }
          prop = prop.replace('params', PARAMS)

          if (pType.hasOwnProperty(FETCH_PARAMS)) {
            if (prop.startsWith(PARAMS)) {
              prop = prop.replace(PARAMS, FETCH_PARAMS)
            }
          }
          this.$watch(prop, function() {
            // If the request is going to be debounced, set IS_FIND_PENDING to true.
            // Without this, there's not a way to show a loading indicator during the debounce timeout.
            const paramsToUse = getParams({
              providedParams: null,
              params: this[PARAMS],
              fetchParams: this[FETCH_PARAMS]
            })
            if (paramsToUse && paramsToUse.debounce) {
              this[IS_FIND_PENDING] = true
            }
            return this[`${FIND_ACTION}DebouncedProxy`]()
          })
        })

        return this[FIND_ACTION]()
      } else {
        if (!local) {
          // TODO: Add this message to the logging:
          //       "Pass { local: true } to disable this warning and only do local queries."
          console.log(
            `No "${PARAMS}" or "${FETCH_PARAMS}" attribute was found in the makeFindMixin for the "${service}" service (using name "${nameToUse}").  No queries will be made.`
          )
        }
      }
    }
  }

  function hasSomeAttribute(vm, ...attributes) {
    return attributes.some(a => {
      return vm.hasOwnProperty(a) || Object.getPrototypeOf(vm).hasOwnProperty(a)
    })
  }

  function setupAttribute(
    NAME,
    value,
    computedOrMethods = 'computed',
    returnTheValue = false
  ) {
    if (typeof value === 'boolean') {
      data[NAME] = !!value
    } else if (typeof value === 'string') {
      mixin.computed[NAME] = function() {
        // If the specified computed prop wasn't found, display an error.
        if (!returnTheValue) {
          if (!hasSomeAttribute(this, value, NAME)) {
            throw new Error(
              `Value for ${NAME} was not found on the component at '${value}'.`
            )
          }
        }
        return returnTheValue ? value : this[value]
      }
    } else if (typeof value === 'function') {
      mixin[computedOrMethods][NAME] = value
    }
  }

  setupAttribute(SERVICE_NAME, service, 'computed', true)
  setupAttribute(PARAMS, params)
  setupAttribute(FETCH_PARAMS, fetchQuery)
  setupAttribute(QUERY_WHEN, queryWhen, 'computed')
  setupAttribute(LOCAL, local)

  return mixin
}
