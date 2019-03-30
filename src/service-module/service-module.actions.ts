/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { observableDiff, applyChange } from 'deep-diff'

export default function makeServiceActions(service, { debug }) {
  const serviceActions = {
    find({ commit, dispatch, state }, params) {
      params = params || {}
      const { idField } = state
      const handleResponse = response => {
        const { qid = 'default', query } = params

        dispatch('addOrUpdateList', response)
        commit('unsetPending', 'find')

        const mapItemFromState = item => {
          const id = item[idField]

          return state.keyedById[id]
        }

        // The pagination data will be under `pagination.default` or whatever qid is passed.
        if (response.data) {
          commit('updatePaginationForQuery', { qid, response, query })

          const mappedFromState = response.data.map(mapItemFromState)

          if (mappedFromState[0] !== undefined) {
            response.data = mappedFromState
          }
        } else {
          const mappedFromState = response.map(mapItemFromState)

          if (mappedFromState[0] !== undefined) {
            response = mappedFromState
          }
        }

        dispatch('afterFind', response)

        return response
      }
      const handleError = error => {
        commit('setError', { method: 'find', error })
        commit('unsetPending', 'find')
        return Promise.reject(error)
      }

      commit('setPending', 'find')

      return service
        .find(params)
        .then(handleResponse)
        .catch(handleError)
    },

    // Two query syntaxes are supported, since actions only receive one argument.
    //   1. Just pass the id: `get(1)`
    //   2. Pass arguments as an array: `get([null, params])`
    get({ state, getters, commit, dispatch }, args) {
      const { idField } = state
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
          .then(item => {
            const id = item[idField]

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
      const existedItem = getters.get(id, params)
      if (existedItem) {
        if (!skipRequestIfExists) getFromRemote()
        return Promise.resolve(existedItem)
      }
      return getFromRemote()
    },

    create({ commit, dispatch, state }, dataOrArray) {
      const { idField } = state
      let data
      let params

      if (Array.isArray(dataOrArray)) {
        data = dataOrArray[0]
        params = dataOrArray[1]
      } else {
        data = dataOrArray
      }

      params = params || {}

      commit('setPending', 'create')

      return service
        .create(data, params)
        .then(response => {
          if (Array.isArray(response)) {
            dispatch('addOrUpdateList', response)
            response = response.map(item => {
              const id = item[idField]

              return state.keyedById[id]
            })
          } else {
            const id = response[idField]

            dispatch('addOrUpdate', response)

            response = state.keyedById[id]
          }
          commit('unsetPending', 'create')
          return response
        })
        .catch(error => {
          commit('setError', { method: 'create', error })
          commit('unsetPending', 'create')
          return Promise.reject(error)
        })
    },

    update({ commit, dispatch, state }, [id, data, params]) {
      const { idField } = state

      commit('setPending', 'update')

      return service
        .update(id, data, params)
        .then(item => {
          const id = item[idField]
          dispatch('addOrUpdate', item)
          commit('unsetPending', 'update')
          return state.keyedById[id]
        })
        .catch(error => {
          commit('setError', { method: 'update', error })
          commit('unsetPending', 'update')
          return Promise.reject(error)
        })
    },

    patch({ commit, dispatch, state }, [id, data, params]) {
      const { idField, diffOnPatch } = state

      commit('setPending', 'patch')

      if (diffOnPatch) {
        const { observableDiff, applyChange } = diffFunctions()
        let diff = {}

        observableDiff(state.copy, data, function(d) {
          if (d.path && d.path.length) {
            // Apply all changes except to the id property...
            if (d.path[d.path.length - 1] !== idField) {
              applyChange(diff, data, d)
            }
          }
        })

        data = diff
      }

      return service
        .patch(id, data, params)
        .then(item => {
          const id = item[idField]

          dispatch('addOrUpdate', item)
          commit('unsetPending', 'patch')
          return state.keyedById[id]
        })
        .catch(error => {
          commit('setError', { method: 'patch', error })
          commit('unsetPending', 'patch')
          return Promise.reject(error)
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

      commit('setPending', 'remove')

      return service
        .remove(id, params)
        .then(item => {
          commit('removeItem', id)
          commit('unsetPending', 'remove')
          return item
        })
        .catch(error => {
          commit('setError', { method: 'remove', error })
          commit('unsetPending', 'remove')
          return Promise.reject(error)
        })
    }
  }

  const actions = {
    afterFind() {},
    addOrUpdateList({ state, commit }, response) {
      const list = response.data || response
      const isPaginated = response.hasOwnProperty('total')
      const toAdd = []
      const toUpdate = []
      const toRemove = []
      const { idField, autoRemove } = state

      list.forEach(item => {
        let id = item[idField]
        let existingItem = state.keyedById[id]

        if (id !== null && id !== undefined) {
          existingItem ? toUpdate.push(item) : toAdd.push(item)
        }
      })

      if (!isPaginated && autoRemove) {
        // Find IDs from the state which are not in the list
        state.ids.forEach(id => {
          if (
            id !== state.currentId &&
            !list.some(item => item[idField] === id)
          ) {
            toRemove.push(state.keyedById[id])
          }
        })
        commit('removeItems', toRemove) // commit removal
      }

      if (service.FeathersVuexModel) {
        toAdd.forEach((item, index) => {
          toAdd[index] = new service.FeathersVuexModel(item, {
            skipCommit: true
          })
        })
      }

      commit('addItems', toAdd)
      commit('updateItems', toUpdate)
    },
    addOrUpdate({ state, commit }, item) {
      const { idField } = state
      let id = item[idField]
      let existingItem = state.keyedById[id]

      const isIdOk = id !== null && id !== undefined

      if (
        service.FeathersVuexModel &&
        !existingItem &&
        !item.isFeathersVuexInstance
      ) {
        item = new service.FeathersVuexModel(item)
      }

      if (isIdOk) {
        existingItem ? commit('updateItem', item) : commit('addItem', item)
      }
    }
  }
  Object.keys(serviceActions).map(method => {
    if (service[method] && typeof service[method] === 'function') {
      actions[method] = serviceActions[method]
    }
  })
  return actions
}
