import deepAssign from 'deep-assign'
import getFilter from 'feathers-query-filters'
// import { sorter, matcher, select, _ } from 'feathers-commons'
import { sorter, matcher, _ } from 'feathers-commons'

export default function makeServiceGetters (service) {
  return {
    list (state) {
      return state.ids.map(id => state.keyedById[id])
    },
    getList: (state, getters) => (params = {}) => {
      const { query, filters } = getFilter(params.query || {})
      let values = _.values(getters.list).filter(matcher(query))

      const total = values.length

      if (filters.$sort) {
        values.sort(sorter(filters.$sort))
      }

      if (filters.$skip) {
        values = values.slice(filters.$skip)
      }

      if (typeof filters.$limit !== 'undefined') {
        values = values.slice(0, filters.$limit)
      }

      if (filters.$select) {
        values = values.map(value => _.pick(value, ...filters.$select))
      }

      return {
        total,
        limit: filters.$limit,
        skip: filters.$skip || 0,
        data: values
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
