import { randomString, getQueryInfo } from './utils'
import _get from 'lodash/get'

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
      type: [Boolean, Function],
      default: true
    },
    // If a separate query is desired to fetch data, use fetchQuery
    // The watchers will automatically be updated, so you don't have to write 'fetchQuery.propName'
    fetchQuery: {
      type: Object
    },
    watch: {
      type: [String, Array],
      default() {
        return []
      }
    },
    local: {
      type: Boolean,
      default: false
    },
    editScope: {
      type: Function,
      default(scope) {
        return scope
      }
    },
    qid: {
      type: String,
      default() {
        return randomString(10)
      }
    },
    /**
     * Set `temps` to true to include temporary records from the store.
     */
    temps: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    isFindPending: false,
    queryId: null,
    pageId: null
  }),
  computed: {
    items() {
      const { query, service, $store, temps } = this
      const params = { query, temps }

      return query ? $store.getters[`${service}/find`](params).data : []
    },
    pagination() {
      return this.$store.state[this.service].pagination[this.qid]
    },
    queryInfo() {
      if (this.pagination == null || this.queryId == null) return {}
      return _get(this.pagination, this.queryId, {})
    },
    pageInfo() {
      if (
        this.pagination == null ||
        this.queryId == null ||
        this.pageId == null
      )
        return {}
      return _get(this.pagination, [this.queryId, this.pageId], {})
    },
    scope() {
      const { items, isFindPending, pagination, queryInfo, pageInfo } = this
      const defaultScope = {
        isFindPending,
        pagination,
        items,
        queryInfo,
        pageInfo
      }

      return this.editScope(defaultScope) || defaultScope
    }
  },
  methods: {
    findData() {
      const query = this.fetchQuery || this.query

      if (
        typeof this.queryWhen === 'function'
          ? this.queryWhen(this.query)
          : this.queryWhen
      ) {
        this.isFindPending = true

        if (query) {
          const params = { query, qid: this.qid || 'default' }

          return this.$store
            .dispatch(`${this.service}/find`, params)
            .then(response => {
              this.isFindPending = false
              const { queryId, pageId } = getQueryInfo(params, response)
              this.queryId = queryId
              this.pageId = pageId
            })
        }
      }
    },
    fetchData() {
      if (!this.local) {
        if (this.query) {
          return this.findData()
        } else {
          // TODO: access debug boolean from the store config, somehow.
          // eslint-disable-next-line no-console
          console.log(
            `No query and no id provided, so no data will be fetched.`
          )
        }
      }
    }
  },
  created() {
    if (!this.$FeathersVuex) {
      throw new Error(
        `You must first Vue.use the FeathersVuex plugin before using the 'FeathersVuexFind' component.`
      )
    }
    if (!this.$store.state[this.service]) {
      throw new Error(
        `The '${this.service}' plugin not registered with feathers-vuex`
      )
    }

    const watch = Array.isArray(this.watch) ? this.watch : [this.watch]

    if (this.fetchQuery || this.query) {
      watch.forEach(prop => {
        if (typeof prop !== 'string') {
          throw new Error(`Values in the 'watch' array must be strings.`)
        }
        if (this.fetchQuery) {
          if (prop.startsWith('query')) {
            prop = prop.replace('query', 'fetchQuery')
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
