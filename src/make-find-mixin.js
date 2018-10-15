import inflection from 'inflection'

export default function makeFindMixin (options) {
  const { service, name, query, fetchQuery, queryWhen = true, local = false } = options
  let { watch = [] } = options
  if (typeof watch === 'string') {
    watch = [watch]
  }

  if (!service || typeof service !== 'string') {
    throw new Error(`The 'service' option is required in the FeathersVuex make-find-mixin and must be a string.`)
  }

  const prefix = name || inflection.camelize(service, true)
  const capitalized = inflection.capitalize(prefix)
  const ITEMS = prefix
  const IS_FIND_PENDING = `isFind${capitalized}Pending`
  const QUERY = `${prefix}Query`
  const FETCH_QUERY = `${prefix}FetchQuery`
  const QUERY_WHEN = `${prefix}QueryWhen`
  const FIND_ACTION = `find${capitalized}`
  const LOCAL = `${prefix}Local`

  const mixin = {
    data () {
      return {
        [IS_FIND_PENDING]: false
      }
    },
    computed: {
      [QUERY]: typeof query === 'string'
        ? function () {
          // If the specified computed prop wasn't found, display an error.
          if (!Object.getPrototypeOf(this).hasOwnProperty(query)) {
            throw new Error(`Query was not found at ${query}.`)
          }
          return this[query]
        }
        : query,
      [ITEMS] () {
        return this[QUERY] ? this.$store.getters[`${service}/find`]({ query: this[QUERY] }).data : []
      }
    },
    methods: {
      [FIND_ACTION] () {
        const queryToUse = this[FETCH_QUERY] || this[QUERY]

        if (!this[LOCAL]) {
          if (typeof this[QUERY_WHEN] === 'function' ? this[QUERY_WHEN](queryToUse) : this[QUERY_WHEN]) {
            this[IS_FIND_PENDING] = true

            if (queryToUse) {
              return this.$store.dispatch(`${service}/find`, { query: queryToUse })
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

  // // Add the fetchQuery, if provided
  if (fetchQuery) {
    mixin.computed[FETCH_QUERY] = typeof fetchQuery === 'string' ? function () { return this[fetchQuery] } : fetchQuery
  }

  // // Add the queryWhen, if provided
  if (queryWhen) {
    mixin.computed[QUERY_WHEN] = typeof queryWhen === 'string'
      ? function () { return this[queryWhen] }
      : function () { return queryWhen }
  }

  if (typeof local === 'boolean') {
    mixin.data[LOCAL] = !!local
  }
  // TODO: make sure this works
  if (typeof local === 'function') {
    mixin.data[LOCAL] = local
  }

  return mixin
}
