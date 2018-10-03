export default {
  props: {
    service: {
      type: String,
      required: true
    },
    query: {
      type: Object,
      default () {
        return {}
      }
    },
    method: {
      type: String
    },
    queryWhen: {
      type: [ Boolean, Function ],
      default: true
    },
    // For get requests
    id: {
      type: [ Number, String ]
    },
    // If a separate query is desired to fetch data, use fetchQuery
    // The watchers will automatically be updated, so you don't have to write 'fetchQuery.propName'
    fetchQuery: {
      type: Object
    },
    watch: {
      type: [ String, Array ],
      default () {
        return []
      }
    },
    local: {
      type: Boolean,
      default: false
    },
    editScope: {
      type: Function,
      default (scope) {
        return scope
      }
    },
    qid: {
      type: String,
      default () {
        return randomString(10)
      }
    }
  },
  data: () => ({
    isFindPending: false,
    isGetPending: false
  }),
  computed: {
    findItems () {
      return this.$store.getters[`${this.service}/find`]({ query: this.query }).data
    },
    getItem () {
      const getArgs = this.getArgs(this.query)

      return this.$store.getters[`${this.service}/get`](getArgs.length === 1 ? this.id : getArgs)
    },
    items () {
      if (this.method === 'find') {
        return this.findItems
      } else if (this.method === 'get') {
        return this.getItem
      } else if (this.id !== undefined && this.id !== null) {
        return this.getItem
      } else {
        return this.findItems
      }
    },
    pagination () {
      return this.$store.state[this.service].pagination[this.qid]
    },
    scope () {
      const { items, isFindPending, isGetPending, pagination } = this
      const defaultScope = { items, isFindPending, isGetPending, pagination }
      return this.editScope(defaultScope) || defaultScope
    }
  },
  methods: {
    getArgs (queryToUse) {
      const query = queryToUse || this.fetchQuery || this.query
      const getArgs = [this.id]

      if (query) {
        getArgs.push({ query })
      }

      return getArgs
    },
    findData () {
      const query = this.fetchQuery || this.query

      if (typeof this.queryWhen === 'function' ? this.queryWhen(this.query) : this.queryWhen) {
        this.isFindPending = true

        return this.$store.dispatch(`${this.service}/find`, { query })
          .then(() => {
            this.isFindPending = false
          })
      }
    },
    getData () {
      const getArgs = this.getArgs()

      if (typeof this.queryWhen === 'function' ? this.queryWhen(...getArgs) : this.queryWhen) {
        this.isGetPending = true

        return this.$store.dispatch(`${this.service}/get`, getArgs.length === 1 ? this.id : getArgs)
          .then(() => {
            this.isGetPending = false
          })
      }
    },
    fetchData () {
      if (!this.local) {
        if (this.method === 'find') {
          return this.findData()
        } else if (this.method === 'get') {
          return this.getData()
        } else if (this.id !== undefined && this.id !== null) {
          return this.getData()
        } else {
          return this.findData()
        }
      }
    }
  },
  watch: {
    id: 'fetchData'
  },
  created () {
    if (!this.$FeathersVuex) {
      throw new Error(`You must first Vue.use the FeathersVuex plugin before using the 'feathers-vuex-data' component.`)
    }
    if (!this.$store.state[this.service]) {
      throw new Error(`The '${this.service}' plugin cannot be found. Did you register the service with feathers-vuex?`)
    }

    const watch = Array.isArray(this.watch) ? this.watch : [ this.watch ]

    if (this.fetchQuery || this.query || (this.id !== null && this.id !== undefined)) {
      watch.forEach(prop => {
        if (typeof prop !== 'string') {
          throw new Error(`Values in the 'watch' array must be strings.`)
        }
        if (this.fetchQuery) {
          if (prop.startsWith('query')) {
            prop.replace('query', 'fetchQuery')
          }
        }
        this.$watch(prop, this.fetchData)
      })

      this.fetchData()
    }
  },
  render () {
    return this.$scopedSlots.default(this.scope)
  }
}

function randomString (length) {
  let text = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}
