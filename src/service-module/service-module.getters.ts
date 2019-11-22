/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import sift from 'sift'
import { _ } from '@feathersjs/commons'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import { globalModels as models } from './global-models'
import _get from 'lodash/get'
import _omit from 'lodash/omit'

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

      // Set params.temps to true to include the tempsById records
      params.temps = params.hasOwnProperty('temps') ? params.temps : false

      const { paramsForServer, whitelist } = state
      const q = _omit(params.query || {}, paramsForServer)
      const customOperators = Object.keys(q).filter(
        k => k[0] === '$' && !defaultOps.includes(k)
      )
      const cleanQuery = _omit(q, customOperators)

      const { query, filters } = filterQuery(cleanQuery, {
        operators: additionalOperators.concat(whitelist)
      })
      let values = _.values(state.keyedById)

      if (params.temps) {
        values = values.concat(_.values(state.tempsById))
      }

      values = values.filter(sift(query))

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
    get: state => (id, params = {}) => {
      const { keyedById, tempsById, idField, tempIdField } = state
      const record = keyedById[id]
        ? select(params, idField)(keyedById[id])
        : undefined
      const tempRecord = tempsById[id]
        ? select(params, tempIdField)(tempsById[id])
        : undefined
      return record || tempRecord
    },
    getCopyById: state => id => {
      const { servicePath, keepCopiesInStore, serverAlias } = state

      if (keepCopiesInStore) {
        return state.copiesById[id]
      } else {
        const Model = _get(
          models,
          `[${serverAlias}].byServicePath[${servicePath}]`
        )

        return Model.copiesById[id]
      }
    }
  }
}
