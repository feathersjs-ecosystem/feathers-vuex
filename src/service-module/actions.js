import { checkId, diffFunctions } from '../utils'

export default function makeServiceActions (service, { debug }) {
  const serviceActions = {
    find ({ commit, dispatch, getters, state }, params = {}) {
      const { idField } = state
      const handleResponse = response => {
        const { qid = 'default', query } = params

        dispatch('addOrUpdateList', response)
        commit('unsetFindPending')

        // The pagination data will be under `pagination.default` or whatever qid is passed.
        if (response.data) {
          commit('updatePaginationForQuery', { qid, response, query })
          response.data = response.data.map(item => {
            const id = item[idField]

            return state.keyedById[id]
          })
        } else {
          response = response.map(item => {
            const id = item[idField]

            return state.keyedById[id]
          })
        }

        return response
      }
      const handleError = error => {
        commit('setFindError', error)
        commit('unsetFindPending')
        return Promise.reject(error)
      }
      const request = service.find(params)

      commit('setFindPending')

      if (service.rx) {
        Object.getPrototypeOf(request).catch(handleError)
      } else {
        request.catch(handleError)
      }

      return request.subscribe ? request.subscribe(handleResponse) : request.then(handleResponse)
    },

    // Two query syntaxes are supported, since actions only receive one argument.
    //   1. Just pass the id: `get(1)`
    //   2. Pass arguments as an array: `get([null, params])`
    get ({ state, getters, commit, dispatch }, args) {
      const { idField } = state
      let id
      let params
      let skipRequestIfExists

      if (Array.isArray(args)) {
        id = args[0]
        params = args[1]
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

      function getFromRemote () {
        commit('setGetPending')
        return service.get(id, params)
          .then(item => {
            const id = item[idField]

            dispatch('addOrUpdate', item)
            commit('setCurrent', item)
            commit('unsetGetPending')
            return state.keyedById[id]
          })
          .catch(error => {
            commit('setGetError', error)
            commit('unsetGetPending')
            return Promise.reject(error)
          })
      }

      // If the records is already in store, return it
      const existedItem = getters.get(id, params)
      if (existedItem) {
        commit('setCurrent', existedItem)
        if (skipRequestIfExists) return Promise.resolve(existedItem)
      }
      return getFromRemote()
    },

    create ({ commit, dispatch, state }, dataOrArray) {
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

      commit('setCreatePending')

      return service.create(data, params)
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
            commit('setCurrent', response)
            response = state.keyedById[id]
          }
          commit('unsetCreatePending')
          return response
        })
        .catch(error => {
          commit('setCreateError', error)
          commit('unsetCreatePending')
          return Promise.reject(error)
        })
    },

    update ({ commit, dispatch, state }, [id, data, params]) {
      const { idField } = state

      commit('setUpdatePending')

      return service.update(id, data, params)
        .then(item => {
          const id = item[idField]
          dispatch('addOrUpdate', item)
          commit('unsetUpdatePending')
          return state.keyedById[id]
        })
        .catch(error => {
          commit('setUpdateError', error)
          commit('unsetUpdatePending')
          return Promise.reject(error)
        })
    },

    patch ({ commit, dispatch, state }, [id, data, params]) {
      const { idField, diffOnPatch } = state

      commit('setPatchPending')

      if (diffOnPatch) {
        const { observableDiff, applyChange } = diffFunctions()
        let diff = {}

        observableDiff(state.copy, data, function (d) {
          if (d.path && d.path.length) {
            // Apply all changes except to the id property...
            if (d.path[d.path.length - 1] !== idField) {
              applyChange(diff, data, d)
            }
          }
        })

        data = diff
      }

      return service.patch(id, data, params)
        .then(item => {
          const id = item[idField]

          dispatch('addOrUpdate', item)
          commit('unsetPatchPending')
          return state.keyedById[id]
        })
        .catch(error => {
          commit('setPatchError', error)
          commit('unsetPatchPending')
          return Promise.reject(error)
        })
    },

    remove ({ commit, dispatch }, idOrArray) {
      let id
      let params

      if (Array.isArray(idOrArray)) {
        id = idOrArray[0]
        params = idOrArray[1]
      } else {
        id = idOrArray
      }

      params = params || {}

      commit('setRemovePending')

      return service.remove(id, params)
        .then(item => {
          commit('removeItem', id)
          commit('unsetRemovePending')
          return item
        })
        .catch(error => {
          commit('setRemoveError', error)
          commit('unsetRemovePending')
          return Promise.reject(error)
        })
    }
  }

  const actions = {
    addOrUpdateList ({ state, commit }, response) {
      const list = response.data || response
      const isPaginated = response.hasOwnProperty('total')
      const toAdd = []
      const toUpdate = []
      const toRemove = []
      const { idField, autoRemove } = state

      list.forEach((item, index) => {
        let id = item[idField]
        let existingItem = state.keyedById[id]

        const isIdOk = checkId(id, item, debug)

        if (isIdOk) {
          existingItem ? toUpdate.push(item) : toAdd.push(item)
        }
      })

      if (!isPaginated && autoRemove) {
        // Find IDs from the state which are not in the list
        state.ids.forEach(id => {
          if (id !== state.currentId && !list.some(item => item[idField] === id)) {
            toRemove.push(state.keyedById[id])
          }
        })
        commit('removeItems', toRemove) // commit removal
      }

      if (service.Model) {
        toAdd.forEach((item, index) => {
          toAdd[index] = new service.Model(item, {skipCommit: true})
        })
      }

      commit('addItems', toAdd)
      commit('updateItems', toUpdate)
    },
    addOrUpdate ({ state, commit }, item) {
      const { idField } = state
      let id = item[idField]
      let existingItem = state.keyedById[id]

      const isIdOk = checkId(id, item, debug)

      if (service.Model && !existingItem && !item.isFeathersVuexInstance) {
        item = new service.Model(item)
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
