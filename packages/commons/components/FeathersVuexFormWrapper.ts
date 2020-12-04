export default {
  name: 'FeathersVuexFormWrapper',
  model: {
    prop: 'item',
    event: 'update:item'
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    /**
     * By default, when you call the `save` method, the cloned data will be
     * committed to the store BEFORE saving tot he API server. Set
     * `:eager="false"` to only update the store with the API server response.
     */
    eager: {
      type: Boolean,
      default: true
    },
    // Set to false to prevent re-cloning if the object updates.
    watch: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({
    clone: null,
    isDirty: false
  }),
  computed: {
    isNew() {
      return (this.item && this.item.__isTemp) || false
    }
  },
  watch: {
    item: {
      handler: 'setup',
      immediate: true,
      deep: true
    }
  },
  emits: ['saved', 'saved-new', 'reset', 'removed'],
  methods: {
    setup() {
      if (this.item) {
        this.isDirty = false
        // Unwatch the clone to prevent running watchers during reclone
        if (this.unwatchClone) {
          this.unwatchClone()
        }

        this.clone = this.item.clone()

        // Watch the new clone.
        this.unwatchClone = this.$watch('clone', {
          handler: 'markAsDirty',
          deep: true
        })
      }
    },
    save(params) {
      if (this.eager) {
        this.clone.commit()
      }
      return this.clone.save(params).then((response) => {
        this.$emit('saved', response)
        if (this.isNew) {
          this.$emit('saved-new', response)
        }
        return response
      })
    },
    reset() {
      this.clone.reset()
      this.isDirty = false
      this.$emit('reset', this.item)
    },
    async remove() {
      await this.item.remove()
      this.$emit('removed', this.item)
      return this.item
    },
    markAsDirty() {
      if (!this.isDirty) {
        this.isDirty = true
      }
    }
  },
  render() {
    const { clone, save, reset, remove, isDirty, isNew } = this
    return this.$scopedSlots.default({
      clone,
      save,
      reset,
      remove,
      isDirty,
      isNew
    })
  }
}
