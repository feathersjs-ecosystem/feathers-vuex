export default {
  props: {
    /**
     * The path of the service from which to pull records.
     */
    service: {
      type: String,
      required: true
    },
    /**
     * Must match the `serverAlias` that was provided in the service's configuration.
     */
    serverAlias: {
      type: String,
      default: 'api'
    },
    /**
     * By default, `query` is used to get data from the Vuex store AND the API request.
     * If you specify a `fetchQuery`, then `query` will only be used for the Vuex store.
     */
    query: {
      type: Object,
      default: null
    },
    /**
     * When `queryWhen` evaluates to false, no API request will be made.
     */
    queryWhen: {
      type: [Boolean, Function],
      default: true
    },
    // For get requests
    id: {
      type: [Number, String],
      default: null
    },
    /**
     * If a separate query is desired to fetch data, use fetchQuery
     * The watchers are automatically updated, so you don't have to write 'fetchQuery.propName'
     */
    fetchQuery: {
      type: Object
    },
    /**
     * Specify which properties in the query to watch and re-trigger API requests.
     */
    watch: {
      type: [String, Array],
      default() {
        return []
      }
    },
    /**
     * Set `local` to true to only requests from the Vuex data store and not make API requests.
     */
    local: {
      type: Boolean,
      default: false
    },
    /**
     * This function is called by the getter and allows you to intercept the `item` in the
     * response to pass it into the parent component's scope.  It's a dirty little cheater
     * function (because it's called from a getter), but it actually works well  ;)
     */
    editScope: {
      type: Function,
      default(scope) {
        return scope
      }
    }
  },
  data: () => ({
    isFindPending: false,
    isGetPending: false
  }),
  computed: {
    item() {
      const getArgs = this.getArgs(this.query)

      if (this.id) {
        return (
          this.$store.getters[`${this.service}/get`](
            getArgs.length === 1 ? this.id : getArgs
          ) || null
        )
      } else {
        return null
      }
    },
    scope() {
      const { item, isGetPending } = this
      const defaultScope = { item, isGetPending }

      return this.editScope(defaultScope) || defaultScope
    }
  },
  methods: {
    getArgs(queryToUse) {
      const query = queryToUse || this.fetchQuery || this.query
      const getArgs = [this.id]

      if (query && Object.keys(query).length > 0) {
        getArgs.push({ query })
      }

      return getArgs
    },
    getData() {
      const getArgs = this.getArgs()

      if (
        typeof this.queryWhen === 'function'
          ? this.queryWhen(...getArgs)
          : this.queryWhen
      ) {
        this.isGetPending = true

        if (this.id) {
          return this.$store
            .dispatch(
              `${this.service}/get`,
              getArgs.length === 1 ? this.id : getArgs
            )
            .then(() => {
              this.isGetPending = false
            })
        }
      }
    },
    fetchData() {
      if (this.local || this.id === 'new') {
        return
      } else if (
        this.id !== null &&
        this.id !== undefined &&
        !this.query &&
        !this.fetchQuery
      ) {
        return this.getData()
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `No query and no id provided, so no data will be fetched.`
        )
      }
    }
  },
  created() {
    if (!this.$FeathersVuex) {
      throw new Error(
        `You must first Vue.use the FeathersVuex plugin before using the 'FeathersVuexGet' component.`
      )
    }
    if (!this.$store.state[this.service]) {
      throw new Error(
        `The '${ this.service }' plugin is not registered with feathers-vuex`
      )
    }

    const watch = Array.isArray(this.watch) ? this.watch : [this.watch]

    if (
      this.fetchQuery ||
      this.query ||
      (this.id !== null && this.id !== undefined)
    ) {
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
  render() {
    return this.$scopedSlots.default(this.scope)
  }
}
