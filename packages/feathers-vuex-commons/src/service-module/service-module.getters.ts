/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import sift from 'sift'
import { _ } from '@feathersjs/commons'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import { models } from './global-models'
import _get from 'lodash/get'
import _omit from 'lodash/omit'
import { isRef } from 'vue-demi'
import { ServiceState } from './service-module.state'
import { Id } from '@feathersjs/feathers'

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

const getCopiesById = ({ keepCopiesInStore, servicePath, serverAlias, copiesById }) => {
  if (keepCopiesInStore) {
    return copiesById
  } else {
    const Model = _get(models, [serverAlias, 'byServicePath', servicePath])

    return Model.copiesById
  }
}

export default function makeServiceGetters(options) {
  const { model } = options
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

      // Set params.copies to true to include the copiesById records
      params.copies = params.hasOwnProperty('copies') ? params.copies : false

      const { paramsForServer, whitelist, keyedById } = state
      const q = _omit(params.query || {}, paramsForServer)

      const { query, filters } = filterQuery(q, {
        operators: additionalOperators.concat(whitelist),
      })
      let values = _.values(keyedById)

      if (params.temps) {
        values.push(..._.values(state.tempsById))
      }

      values = values.filter(sift(query))

      if (params.copies) {
        const { idField } = state
        const copiesById = getCopiesById(state)
        values.forEach((val, i, arr) => {
          const copy = copiesById[val[idField]]
          if (copy) {
            // replace keyedById value with existing clone value
            arr[i] = copy
          }
        })
      }

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

      /**
       * Many are of the opinion that having a mutation inside of a getter is a big "no no", I've followed this way
       * of thinking for a long time.  This allows SSR apps and vuex-persist apps to just work like normal, and it's
       * very fast compared to other hydration options.  This enables seamless, lazy hydration to work.
       */
      values = values.map(item => {
        const isInstance =
          (!!model && item instanceof model) || (item.constructor && !!item.constructor.idField)
        if (model && !isInstance) {
          item = new model(item, { skipStore: true })
          model.replaceItem(item)
        }
        return item
      })

      return {
        total,
        limit: filters.$limit || 0,
        skip: filters.$skip || 0,
        data: values,
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

      return getters.find(params).total
    },
    get: ({ keyedById, tempsById, idField, tempIdField }) => (id, params = {}) => {
      if (isRef(id)) {
        id = id.value
      }
      if (isRef(params)) {
        params = params.value
      }
      let item = keyedById[id] && select(params, idField)(keyedById[id])
      if (item) {
        const isInstance =
          (!!model && item instanceof model) || (item.constructor && !!item.constructor.idField)
        if (model && !isInstance) {
          item = new model(item, { skipStore: true })
          model.replaceItem(item)
        }
        return item
      }
      const tempItem = tempsById[id] && select(params, tempIdField)(tempsById[id])

      return tempItem || null
    },
    getCopyById: state => id => {
      const copiesById = getCopiesById(state)
      return copiesById[id]
    },

    isCreatePendingById: ({ isIdCreatePending }: ServiceState) => (id: Id) =>
      isIdCreatePending.includes(id),
    isUpdatePendingById: ({ isIdUpdatePending }: ServiceState) => (id: Id) =>
      isIdUpdatePending.includes(id),
    isPatchPendingById: ({ isIdPatchPending }: ServiceState) => (id: Id) =>
      isIdPatchPending.includes(id),
    isRemovePendingById: ({ isIdRemovePending }: ServiceState) => (id: Id) =>
      isIdRemovePending.includes(id),
    isSavePendingById: (state: ServiceState, getters) => (id: Id) =>
      getters.isCreatePendingById(id) ||
      getters.isUpdatePendingById(id) ||
      getters.isPatchPendingById(id),
    isPendingById: (state: ServiceState, getters) => (id: Id) =>
      getters.isSavePendingById(id) || getters.isRemovePendingById(id),
  }
}

export type GetterName = keyof ReturnType<typeof makeServiceGetters>
