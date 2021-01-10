/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import fastCopy from 'fast-copy'
import { getId } from '../utils'
import { Service } from '@feathersjs/feathers'
import { MakeServicePluginOptions } from './types'

interface serviceAndOptions {
  service: Service<any>
  options: MakeServicePluginOptions
}

export default function makeServiceActions({service, options}: serviceAndOptions) {
  const serviceActions = {
    find({ commit, dispatch }, params) {
      params = params || {}
      params = fastCopy(params)

      // For working with client-side services, paginate.default must be truthy.
      if (params.paginate === true) {
        params.paginate = { default: true }
      }

      commit('setPending', 'find')

      return service
        .find(params)
        .then(response => dispatch('handleFindResponse', { params, response }))
        .catch(error => dispatch('handleFindError', { params, error }))
    },

    // Two query syntaxes are supported, since actions only receive one argument.
    //   1. Just pass the id: `get(1)`
    //   2. Pass arguments as an array: `get([null, params])`
    get({ state, getters, commit, dispatch }, args) {
      let id
      let params
      let skipRequestIfExists

      if (Array.isArray(args)) {
        id = args[0]
        params = args[1] || {}
      } else {
        id = args
        params = {}
      }

      params = fastCopy(params)

      if ('skipRequestIfExists' in params) {
        skipRequestIfExists = params.skipRequestIfExists
        delete params.skipRequestIfExists
      } else {
        skipRequestIfExists = state.skipRequestIfExists
      }

      function getFromRemote() {
        commit('setPending', 'get')
        return service
          .get(id, params)
          .then(async function (item) {
            dispatch('addOrUpdate', item)
            commit('unsetPending', 'get')
            return state.keyedById[id]
          })
          .catch(error => {
            commit('setError', { method: 'get', error })
            commit('unsetPending', 'get')
            return Promise.reject(error)
          })
      }

      // If the records is already in store, return it
      const existingItem = getters.get(id, params)
      if (existingItem && skipRequestIfExists) {
        return Promise.resolve(existingItem)
      }
      return getFromRemote()
    },

    create({ commit, dispatch, state }, dataOrArray) {
      const { idField, tempIdField } = state
      let data
      let params
      let tempIds

      if (Array.isArray(dataOrArray)) {
        data = dataOrArray[0]
        params = dataOrArray[1]
      } else {
        data = dataOrArray
      }

      params = fastCopy(params)

      if (Array.isArray(data)) {
        tempIds = data.map(i => i[tempIdField])
      } else {
        tempIds = [data[tempIdField]] // Array of tempIds
      }

      params = params || {}

      commit('setPending', 'create')
      commit('setIdPending', { method: 'create', id: tempIds })

      return service
        .create(data, params)
        .then(async response => {
          if (Array.isArray(response)) {
            dispatch('addOrUpdateList', response)
            response = response.map(item => {
              const id = getId(item, idField)

              return state.keyedById[id]
            })
          } else {
            const id = getId(response, idField)
            const tempId = tempIds[0]

            if (id != null && tempId != null) {
              commit('updateTemp', { id, tempId })
            }
            response = dispatch('addOrUpdate', response)

            // response = state.keyedById[id]
          }
          commit('removeTemps', tempIds)
          return response
        })
        .catch(error => {
          commit('setError', { method: 'create', error })
          return Promise.reject(error)
        })
        .finally(() => {
          commit('unsetPending', 'create')
          commit('unsetIdPending', { method: 'create', id: tempIds })
        })
    },

    update({ commit, dispatch, state }, [id, data, params]) {
      commit('setPending', 'update')
      commit('setIdPending', { method: 'update', id })

      params = fastCopy(params)

      return service
        .update(id, data, params)
        .then(async function (item) {
          dispatch('addOrUpdate', item)
          return state.keyedById[id]
        })
        .catch(error => {
          commit('setError', { method: 'update', error })
          return Promise.reject(error)
        })
        .finally(() => {
          commit('unsetPending', 'update')
          commit('unsetIdPending', { method: 'update', id })
        })
    },

    /**
     * If params.data is provided, it will be passed as the patch data (instead of the `data` arg).
     * This provides a simple way to patch with partial data.
     */
    patch({ commit, dispatch, state }, [id, data, params]) {
      commit('setPending', 'patch')
      commit('setIdPending', { method: 'patch', id })

      params = fastCopy(params)

      if (service.FeathersVuexModel && (!params || !params.data)) {
        data = service.FeathersVuexModel.diffOnPatch(data)
      }
      if (params && params.data) {
        data = params.data
      }

      return service
        .patch(id, data, params)
        .then(async function (item) {
          dispatch('addOrUpdate', item)
          return state.keyedById[id]
        })
        .catch(error => {
          commit('setError', { method: 'patch', error })
          return Promise.reject(error)
        })
        .finally(() => {
          commit('unsetPending', 'patch')
          commit('unsetIdPending', { method: 'patch', id })
        })
    },

    remove({ commit }, idOrArray) {
      let id
      let params

      if (Array.isArray(idOrArray)) {
        id = idOrArray[0]
        params = idOrArray[1]
      } else {
        id = idOrArray
      }

      params = params || {}
      params = fastCopy(params)

      commit('setPending', 'remove')
      commit('setIdPending', { method: 'remove', id })

      return service
        .remove(id, params)
        .then(item => {
          commit('removeItem', id)
          return item
        })
        .catch(error => {
          commit('setError', { method: 'remove', error })
          return Promise.reject(error)
        })
        .finally(() => {
          commit('unsetPending', 'remove')
          commit('unsetIdPending', { method: 'remove', id })
        })
    }
  }

  const actions = {
    count({ dispatch }, params) {
      params = params || {}
      params = fastCopy(params)

      if (!params.query) {
        throw 'params must contain a query-object'
      }

      params.query.$limit = 0 // <- limit 0 in feathers is a fast count query

      return dispatch('find', params)
        .then(response => {
          return response.total || response.length
        })
        .catch(error => dispatch('handleFindError', { params, error }))
    },
    /**
     * Handle the response from the find action.
     *
     * @param payload consists of the following two params
     *   @param params - Remember that these params aren't what was sent to the
     *         Feathers client.  The client modifies the params object.
     *   @param response
     */
    async handleFindResponse(
      { state, commit, dispatch },
      { params, response }
    ) {
      const { qid = 'default', query } = params
      const { idField } = state

      dispatch('addOrUpdateList', response)
      commit('unsetPending', 'find')

      const mapItemFromState = item => {
        const id = getId(item, idField)

        return state.keyedById[id]
      }

      // The pagination data will be under `pagination.default` or whatever qid is passed.
      response.data &&
        commit('updatePaginationForQuery', { qid, response, query })

      // Swap out the response records for their Vue-observable store versions
      const data = response.data || response
      const mappedFromState = data.map(mapItemFromState)
      if (mappedFromState[0] !== undefined) {
        response.data
          ? (response.data = mappedFromState)
          : (response = mappedFromState)
      }

      response = await dispatch('afterFind', response)

      return response
    },

    async handleFindError({ commit }, { params, error }) {
      commit('setError', { method: 'find', params, error })
      commit('unsetPending', 'find')
      return Promise.reject(error)
    },

    async afterFind({}, response) {
      return response
    },

    addOrUpdateList({ state, commit }, response) {
      const list = response.data || response
      const isPaginated = response.hasOwnProperty('total')
      const toAdd = []
      const toUpdate = []
      const toRemove = []
      const { idField, autoRemove } = state

      const disableRemove = response.disableRemove || !autoRemove

      list.forEach(item => {
        const id = getId(item, idField)
        const existingItem = state.keyedById[id]

        if (id !== null && id !== undefined) {
          existingItem ? toUpdate.push(item) : toAdd.push(item)
        }
      })

      if (!isPaginated && !disableRemove) {
        // Find IDs from the state which are not in the list
        state.ids.forEach(id => {
          if (!list.some(item => getId(item, idField) === id)) {
            toRemove.push(state.keyedById[id])
          }
        })
        commit('removeItems', toRemove) // commit removal
      }

      if (options.Model) {
        toAdd.forEach((item, index) => {
          toAdd[index] = new options.Model(item, { commit: false })
        })
      }

      commit('addItems', toAdd)
      commit('updateItems', toUpdate)

      return response
    },

    /**
     * Adds or updates an item. If a matching temp record is found in the store,
     * the temp record will completely replace the existingItem. This is to work
     * around the common scenario where the realtime `created` event arrives before
     * the `create` response returns to create the record. The reference to the
     * original temporary record must be maintained in order to preserve reactivity.
     */
    addOrUpdate({ state, commit }, item) {
      const { idField } = state
      const id = getId(item, idField)

      const isIdOk = id !== null && id !== undefined

      if (
        service.FeathersVuexModel &&
        !(item instanceof service.FeathersVuexModel)
      ) {
        item = new service.FeathersVuexModel(item, { commit: false })
      }

      if (isIdOk) {
        if (state.keyedById[id]) {
          commit('updateItem', item)
        } else {
          commit('addItem', item)
        }
      }
      return item
    }
  }
  /**
   * Only add a method to the store if the service actually has that same method.
   */
  Object.keys(serviceActions).map(method => {
    if (service[method] && typeof service[method] === 'function') {
      actions[method] = serviceActions[method]
    }
  })
  return actions
}
