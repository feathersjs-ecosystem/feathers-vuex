import { createElement, computed } from '@vue/composition-api'

export default {
  name: 'FeathersVuexPagination',
  props: {
    /**
     * An object containing { $limit, and $skip }
     */
    value: {
      type: Object,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      default: () => null
    },
    /**
     * The `latestQuery` object from the useFind data
     */
    latestQuery: {
      type: Object,
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      default: () => null
    }
  },
  // eslint-disable-next-line
  setup(props, context) {
    // Total
    const pageCount = computed(() => {
      const q = props.latestQuery
      if (q && q.response) {
        return Math.ceil(q.response.total / props.value.$limit)
      } else {
        return 1
      }
    })
    // Current Page
    const currentPage = computed({
      set(pageNumber: number) {
        if (pageNumber < 1) {
          pageNumber = 1
        } else if (pageNumber > pageCount.value) {
          pageNumber = pageCount.value
        }
        const $limit = props.value.$limit
        const $skip = $limit * (pageNumber - 1)

        context.emit('input', { $limit, $skip })
      },
      get() {
        const params = props.value
        if (params) {
          return params.$skip / params.$limit + 1
        } else {
          return 1
        }
      }
    })

    const canPrev = computed(() => {
      return currentPage.value - 1 > 0
    })
    const canNext = computed(() => {
      return currentPage.value + 1 < pageCount.value
    })

    function toStart(): void {
      currentPage.value = 1
    }
    function toEnd(): void {
      currentPage.value = pageCount.value
    }

    function next(): void {
      currentPage.value++
    }
    function prev(): void {
      currentPage.value--
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    return () => {
      if (context.slots.default) {
        return context.slots.default({
          currentPage: currentPage.value,
          pageCount: pageCount.value,
          canPrev: canPrev.value,
          canNext: canNext.value,
          toStart,
          toEnd,
          prev,
          next
        })
      } else {
        return createElement('div', {}, [
          createElement('p', `FeathersVuexPagination uses the default slot:`),
          createElement('p', `#default="{ currentPage, pageCount }"`)
        ])
      }
    }
  }
}
