import _debounce from 'lodash/debounce'

export default {
  name: 'FeathersVuexInputWrapper',
  props: {
    item: {
      type: Object,
      required: true,
    },
    prop: {
      type: String,
      required: true,
    },
    debounce: {
      type: Number,
      default: 0,
    },
  },
  data: () => ({
    clone: null,
  }),
  computed: {
    current() {
      return this.clone || this.item
    },
  },
  watch: {
    debounce: {
      handler(wait) {
        this.debouncedHandler = _debounce(this.handler, wait)
      },
      immediate: true,
    },
  },
  methods: {
    createClone(e) {
      this.clone = this.item.clone()
    },
    cleanup() {
      this.$nextTick(() => {
        this.clone = null
      })
    },
    handler(e, callback) {
      if (!this.clone) {
        this.createClone()
      }
      const maybePromise = callback({
        event: e,
        clone: this.clone,
        prop: this.prop,
        data: { [this.prop]: this.clone[this.prop] },
      })
      if (maybePromise && maybePromise.then) {
        maybePromise.then(this.cleanup)
      } else {
        this.cleanup()
      }
    },
  },
  render() {
    const { current, prop, createClone } = this
    const handler = this.debounce ? this.debouncedHandler : this.handler

    return this.$scopedSlots.default({ current, prop, createClone, handler })
  },
}
