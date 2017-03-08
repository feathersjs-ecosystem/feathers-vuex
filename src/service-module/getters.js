import deepAssign from 'deep-assign'

export default function makeServiceGetters (service) {
  return {
    list (state) {
      return state.ids.map(id => state.keyedById[id])
    },
    findList: (state, getters) => (params) => {
      const { query } = params
      let list = getters.list
      if (query) {
        return list.filter(item => {
          return Object.keys(query).reduce((acc, queryParam) => {
            if (acc) {
              return item[queryParam] === query[queryParam]
            }
            return false
          }, true)
        })
      } else {
        return list
      }
    },
    current (state) {
      return state.currentId ? state.keyedById[state.currentId] : null
    },
    copy (state) {
      return state.currentId ? deepAssign(state.keyedById[state.currentId]) : null
    }
  }
}
