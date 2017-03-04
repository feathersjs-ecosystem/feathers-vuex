import deepAssign from 'deep-assign'

export default function mapGetters (service) {
  return {
    data (state) {
      return Object.keys(state.keyedById).map(key => state.keyedById[key])
    },
    current (state) {
      return state.currentId ? state.keyedById[state.currentId] : null
    },
    copy (state) {
      return state.currentId ? deepAssign(state.keyedById[state.currentId]) : null
    }
  }
}
