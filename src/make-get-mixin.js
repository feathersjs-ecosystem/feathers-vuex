import inflection from 'inflection'

export default function makeFindMixin (options) {
  const { service, query, fetchQuery, id, queryWhen = true, local = false, qid = 'default', item } = options
  let { name, watch = [] } = options

  if (typeof watch === 'string') {
    watch = [watch]
  } else if (typeof watch === 'boolean' && watch) {
    watch = ['query']
  }

  if (!service || (typeof service !== 'string' && typeof service !== 'function')) {
    throw new Error(`The 'service' option is required in the FeathersVuex make-find-mixin and must be a string.`)
  }
  if (typeof service === 'function' && !name) {
    name = 'service'
  }

  const nameToUse = (name || service).replace('-', '_')
  const singularized = inflection.singularize(nameToUse)
  const prefix = inflection.camelize(singularized, true)
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1)
  const SERVICE_NAME = `${prefix}ServiceName`
  let ITEM = item || prefix
  if (typeof service === 'function' && name === 'service' && !item) {
    ITEM = 'item'
  }
  const IS_GET_PENDING = `isGet${capitalized}Pending`
  const QUERY = `${prefix}Query`
  const FETCH_QUERY = `${prefix}FetchQuery`
  const WATCH = `${prefix}Watch`
  const QUERY_WHEN = `${prefix}QueryWhen`
  const GET_ACTION = `get${capitalized}`
  const LOCAL = `${prefix}Local`
  const QID = `${prefix}Qid`
  const ID = `${prefix}Id`
  const data = {
    [IS_GET_PENDING]: false,
    [WATCH]: watch,
    [QID]: qid
  }

  const mixin = {
    data () {
      return data
    },
    computed: {
      [ITEM] () {
        return this[QUERY] ? this.$store.getters[`${SERVICE_NAME}/find`]({ query: this[QUERY] }).data : []
      }
    },
    methods: {
      [GET_ACTION] () {
        const queryToUse = this[FETCH_QUERY] || this[QUERY]

        if (!this[LOCAL]) {
          if (typeof this[QUERY_WHEN] === 'function' ? this[QUERY_WHEN](queryToUse) : this[QUERY_WHEN]) {
            this[IS_GET_PENDING] = true

            if (this[ID]) {
              const params = { query: queryToUse }

              return this.$store.dispatch(`${SERVICE_NAME}/get`, params)
                .then(() => {
                  this[IS_GET_PENDING] = false
                })
            }
          }
        }
      }
    },
    created () {
      if (this[ID] || this[QUERY] || this[FETCH_QUERY]) {
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
          this.$watch(prop, this[GET_ACTION])
        })

        return this[GET_ACTION]()
      }
    }
  }

  setupAttribute(SERVICE_NAME, service, 'computed', true)
  setupAttribute(ID, id)
  setupAttribute(QUERY, query)
  setupAttribute(FETCH_QUERY, fetchQuery)
  setupAttribute(QUERY_WHEN, queryWhen, 'methods')
  setupAttribute(LOCAL, local)

  function setupAttribute (NAME, value, computedOrMethods = 'computed', returnTheValue = false) {
    if (typeof value === 'boolean') {
      data[NAME] = !!value
    } else if (typeof value === 'string') {
      mixin.computed[NAME] = function () {
        // If the specified computed prop wasn't found, display an error.
        if (!Object.getPrototypeOf(this).hasOwnProperty(value) && !Object.getPrototypeOf(this).hasOwnProperty(NAME)) {
          throw new Error(`Value for ${NAME} was not found on the component at '${value}'.`)
        }
        return returnTheValue ? value : this[value]
      }
    } else if (typeof value === 'function') {
      mixin[computedOrMethods][NAME] = value
    }
  }

  return mixin
}
