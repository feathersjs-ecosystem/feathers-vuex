export default {
  props: {
    service: {
      type: String,
      required: true
    },
    query: {
      type: Object,
      default: null
    },
    queryWhen: {
      type: [ Boolean, Function ],
      default: true
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
    isFindPending: false
  }),
  computed: {
    items () {
      const { query, service, $store } = this

      return query ? $store.getters[`${service}/find`]({ query }).data : []
    },
    pagination () {
      return this.$store.state[this.service].pagination[this.qid]
    },
    scope () {
      const { items, isFindPending, pagination } = this
      const defaultScope = { isFindPending, pagination, items }

      return this.editScope(defaultScope) || defaultScope
    }
  },
  methods: {
    findData () {
      const query = this.fetchQuery || this.query

      if (typeof this.queryWhen === 'function' ? this.queryWhen(this.query) : this.queryWhen) {
        this.isFindPending = true

        if (query) {
          const params = { query }

          if (this.qid) {
            params.qid = params.qid || this.qid
          }
          return this.$store.dispatch(`${this.service}/find`, params)
            .then(() => {
              this.isFindPending = false
            })
        }
      }
    },
    fetchData () {
      if (!this.local) {
        if (this.query) {
          return this.findData()
        } else {
          // TODO: access debug boolean from from the store config, somehow.
          console.log(`No query and no id provided, so no data will be fetched.`)
        }
      }
    }
  },
  created () {
    if (!this.$FeathersVuex) {
      throw new Error(`You must first Vue.use the FeathersVuex plugin before using the 'feathers-vuex-find' component.`)
    }
    if (!this.$store.state[this.service]) {
      throw new Error(`The '${this.service}' plugin cannot be found. Did you register the service with feathers-vuex?`)
    }

    const watch = Array.isArray(this.watch) ? this.watch : [ this.watch ]

    if (this.fetchQuery || this.query) {
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
