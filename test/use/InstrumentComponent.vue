<template>
  <div>

  </div>
</template>

<script>
import useFind from '../../src/useFind'

export default {
  name: 'InstrumentComponent',
  props: {
    id: {
      type: String,
      default: ''
    }
  },
  setup(props, context) {
    const { Instrument } = context.root.$FeathersVuex

    const instrumentsParams = computed(() => {
      return {
        query: {},
        paginate: false
      }
    })
    const instrumentsData = useFind({ model: Instrument, params: instrumentsParams })
    const { items: instruments } = instrumentsData
  }
}
</script>

<style lang="scss" scoped>

</style>