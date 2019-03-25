/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import sift from 'sift'
import commons from '@feathersjs/commons'
import dbCommons from '@feathersjs/adapter-commons'
import omit from 'lodash.omit'

const { _ } = commons
const { filterQuery, sorter, select } = dbCommons
const FILTERS = ['$sort', '$limit', '$skip', '$select']
const OPERATORS = ['$in', '$nin', '$lt', '$lte', '$gt', '$gte', '$ne', '$or']
const additionalOperators = ['$elemMatch']
const defaultOps = FILTERS.concat(OPERATORS).concat(additionalOperators)

export default function makeServiceGetters() {
  return {
    list(state) {
      return state.ids.map(id => state.keyedById[id])
    },
    find: state => params => {
      params = params || {}
      const { paramsForServer, whitelist } = state
      const q = omit(params.query || {}, paramsForServer)
      const customOperators = Object.keys(q).filter(
        k => k[0] === '$' && !defaultOps.includes(k)
      )
      const cleanQuery = omit(q, customOperators)

      const { query, filters } = filterQuery(cleanQuery, {
        operators: additionalOperators.concat(whitelist)
      })
      let values = _.values(state.keyedById)
      values = sift(query, values)

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
        values = values.map(value => _.pick(value, ...filters.$select.slice()))
      }

      return {
        total,
        limit: filters.$limit || 0,
        skip: filters.$skip || 0,
        data: values
      }
    },
    get: ({ keyedById, idField }) => (id, params = {}) => {
      return keyedById[id] ? select(params, idField)(keyedById[id]) : undefined
    },
    current(state) {
      return state.currentId ? state.keyedById[state.currentId] : null
    },
    getCopy(state) {
      return state.copy ? state.copy : null
    },
    getCopyById: state => id => {
      return state.copiesById[id]
    }
  }
}
