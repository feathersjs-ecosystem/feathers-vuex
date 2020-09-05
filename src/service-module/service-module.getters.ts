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
import { isRef } from '@vue/composition-api'
import { ServiceState } from '..'
import { Id } from '@feathersjs/feathers'

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
      if (isRef(params)) {
        params = params.value
      }
      params = { ...params } || {}

      // Set params.temps to true to include the tempsById records
      params.temps = params.hasOwnProperty('temps') ? params.temps : false

      const { paramsForServer, whitelist, keyedById } = state
      const q = _omit(params.query || {}, paramsForServer)

      const { query, filters } = filterQuery(q, {
        operators: additionalOperators.concat(whitelist)
      })
      let values = _.values(keyedById)

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
    count: (state, getters) => params => {
      if (isRef(params)) {
        params = params.value
      }
      if (!params.query) {
        throw 'params must contain a query-object'
      }

      const cleanQuery = _omit(params.query, FILTERS)
      params.query = cleanQuery

      return getters.find(state)(params).total
    },
    get: ({ keyedById, tempsById, idField, tempIdField }) => (
      id,
      params = {}
    ) => {
      if (isRef(id)) {
        id = id.value
      }
      if (isRef(params)) {
        params = params.value
      }
      const record = keyedById[id] && select(params, idField)(keyedById[id])
      if (record) {
        return record
      }
      const tempRecord =
        tempsById[id] && select(params, tempIdField)(tempsById[id])

      return tempRecord || null
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
    },

    isCreatePendingById: ({ isIdCreatePending }: ServiceState) => (id: Id) =>
      isIdCreatePending.includes(id),
    isUpdatePendingById: ({ isIdUpdatePending }: ServiceState) => (id: Id) =>
      isIdUpdatePending.includes(id),
    isPatchPendingById: ({ isIdPatchPending }: ServiceState) => (id: Id) =>
      isIdPatchPending.includes(id),
    isRemovePendingById: ({ isIdRemovePending }: ServiceState) => (id: Id) =>
      isIdRemovePending.includes(id),
    isPendingById: (state: ServiceState, getters) => (id: Id) =>
      getters.isCreatePendingById(id) ||
      getters.isUpdatePendingById(id) ||
      getters.isPatchPendingById(id) ||
      getters.isRemovePendingById(id)
  }
}
