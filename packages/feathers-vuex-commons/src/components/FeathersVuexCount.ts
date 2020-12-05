import { randomString } from '../utils'

export default {
  props: {
    service: {
      type: String,
      required: true,
    },
    params: {
      type: Object,
      default: () => {
        return {
          query: {},
        }
      },
    },
    queryWhen: {
      type: [Boolean, Function],
      default: true,
    },
    // If separate params are desired to fetch data, use fetchParams
    // The watchers will automatically be updated, so you don't have to write 'fetchParams.query.propName'
    fetchParams: {
      type: Object,
    },
    watch: {
      type: [String, Array],
      default: () => [],
    },
    local: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    isCountPending: false,
    serverTotal: null,
  }),
  computed: {
    total() {
      if (!this.local) {
        return this.serverTotal
      } else {
        const { params, service, $store, temps } = this
        return params ? $store.getters[`${service}/count`](params) : 0
      }
    },
    scope() {
      const { total, isCountPending } = this

      return { total, isCountPending }
    },
  },
  methods: {
    findData() {
      const params = this.fetchParams || this.params

      if (typeof this.queryWhen === 'function' ? this.queryWhen(this.params) : this.queryWhen) {
        this.isCountPending = true

        if (params) {
          return this.$store.dispatch(`${this.service}/count`, params).then(response => {
            this.isCountPending = false
            this.serverTotal = response
          })
        }
      }
    },
    fetchData() {
      if (!this.local) {
        if (this.params) {
          return this.findData()
        } else {
          // TODO: access debug boolean from the store config, somehow.
          // eslint-disable-next-line no-console
          console.log(`No query and no id provided, so no data will be fetched.`)
        }
      }
    },
  },
  created() {
    if (!this.$FeathersVuex) {
      throw new Error(
        `You must first Vue.use the FeathersVuex plugin before using the 'FeathersVuexFind' component.`
      )
    }
    if (!this.$store.state[this.service]) {
      throw new Error(`The '${this.service}' plugin not registered with feathers-vuex`)
    }

    const watch = Array.isArray(this.watch) ? this.watch : [this.watch]

    if (this.fetchParams || this.params) {
      watch.forEach(prop => {
        if (typeof prop !== 'string') {
          throw new Error(`Values in the 'watch' array must be strings.`)
        }
        if (this.fetchParams) {
          if (prop.startsWith('params')) {
            prop = prop.replace('params', 'fetchParams')
          }
        }
        this.$watch(prop, this.fetchData)
      })

      this.fetchData()
    }
  },
  render() {
    return this.$scopedSlots.default(this.scope)
  },
}
