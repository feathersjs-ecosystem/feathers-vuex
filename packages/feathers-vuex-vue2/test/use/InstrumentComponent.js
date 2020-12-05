import useGet from '../../src/useGet'

export default {
  name: 'InstrumentComponent',
  template: '<div id="test"> {{ instrument }} </div>',
  props: {
    id: {
      type: String,
      default: ''
    }
  },
  setup(props, context) {
    const { Instrument } = context.root.$FeathersVuex

    const instrumentData = useGet({ model: Instrument, id: props.id })

    return {
      instrument: instrumentData.item
    }
  }
}
