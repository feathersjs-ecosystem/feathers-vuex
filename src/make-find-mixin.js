import inflection from 'inflection'

export default function makeFindMixin (options) {
  const { service, name, query, fetchQuery, queryWhen = true, local = false, qid = 'default', items } = options
  let { watch = [] } = options
  if (typeof watch === 'string') {
    watch = [watch]
  } else if (typeof watch === 'boolean' && watch) {
    watch = ['query']
  }

  if (!service || (typeof service !== 'string' && typeof service !== 'function')) {
    throw new Error(`The 'service' option is required in the FeathersVuex make-find-mixin and must be a string.`)
  }
  const nameToUse = name || service
  const prefix = inflection.camelize(nameToUse, true)
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1)
  const SERVICE_NAME = `${prefix}ServiceName`
  const ITEMS = items || prefix
  const IS_FIND_PENDING = `isFind${capitalized}Pending`
  const QUERY = `${prefix}Query`
  const FETCH_QUERY = `${prefix}FetchQuery`
  const WATCH = `${prefix}Watch`
  const QUERY_WHEN = `${prefix}QueryWhen`
  const FIND_ACTION = `find${capitalized}`
  const PAGINATION = `${prefix}PaginationData`
  const LOCAL = `${prefix}Local`
  const QID = `${prefix}Qid`
  const data = {
    [IS_FIND_PENDING]: false,
    [WATCH]: watch,
    [QID]: qid
  }

  const mixin = {
    data () {
      return data
    },
    computed: {
      [ITEMS] () {
        return this[QUERY] ? this.$store.getters[`${this[SERVICE_NAME]}/find`]({ query: this[QUERY] }).data : []
      }
    },
    methods: {
      [FIND_ACTION] () {
        const queryToUse = this[FETCH_QUERY] || this[QUERY]

        if (!this[LOCAL]) {
          if (typeof this[QUERY_WHEN] === 'function' ? this[QUERY_WHEN](queryToUse) : this[QUERY_WHEN]) {
            this[IS_FIND_PENDING] = true

            if (queryToUse) {
              const params = { query: queryToUse }

              if (qid) {
                params.qid = qid
              }

              return this.$store.dispatch(`${this[SERVICE_NAME]}/find`, params)
                .then(() => {
                  this[IS_FIND_PENDING] = false
                })
            }
          }
        }
      }
    },
    created () {
      if (this[QUERY] || this[FETCH_QUERY]) {
        watch.forEach(prop => {
          if (typeof prop !== 'string') {
            throw new Error(`Values in the 'watch' array must be strings.`)
          }
          prop = prop.replace('query', QUERY)

          if (this[FETCH_QUERY]) {
            if (prop.startsWith(QUERY)) {
              prop.replace(QUERY, FETCH_QUERY)
            }
          }
          this.$watch(prop, this[FIND_ACTION])
        })

        return this[FIND_ACTION]()
      }
    }
  }

  if (qid) {
    mixin.computed[PAGINATION] = function () {
      return this.$store.state[this[SERVICE_NAME]].pagination[qid]
    }
  }

  setupAttribute(SERVICE_NAME, service, 'computed', true)
  setupAttribute(QUERY, query)
  setupAttribute(FETCH_QUERY, fetchQuery)
  setupAttribute(QUERY_WHEN, queryWhen, 'method')
  setupAttribute(LOCAL, local)

  function setupAttribute (NAME, value, computedOrMethod = 'computed', returnTheValue = false) {
    if (typeof value === 'boolean') {
      data[NAME] = !!value
    } else if (typeof value === 'string') {
      mixin.computed[NAME] = function () {
        // If the specified computed prop wasn't found, display an error.
        if (!Object.getPrototypeOf(this).hasOwnProperty(value)) {
          throw new Error(`Value for ${NAME} was not found on the component at '${value}'.`)
        }
        return returnTheValue ? value : this[value]
      }
    } else if (typeof value === 'function') {
      mixin[computedOrMethod][NAME] = value
    }
  }

  return mixin
}
