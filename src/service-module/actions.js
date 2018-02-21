import { checkId } from '../utils'

export default function makeServiceActions (service, { debug }) {
  const serviceActions = {
    find ({ commit, dispatch, getters }, params = {}) {
      commit('setFindPending')

      const handleResponse = response => {
        const { qid = 'default', query } = params

        dispatch('addOrUpdateList', response)
        commit('unsetFindPending')

        // The pagination data will be under `pagination.default` or whatever qid is passed.
        if (response.data) {
          commit('updatePaginationForQuery', { qid, response, query })
        }

        return response
      }
      const handleError = error => {
        commit('setFindError', error)
        commit('unsetFindPending')
        return Promise.reject(error)
      }

      const request = service.find(params)

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
    get ({ commit, dispatch }, args) {
      let id
      let params

      if (Array.isArray(args)) {
        id = args[0]
        params = args[1]
      } else {
        id = args
      }

      commit('setGetPending')

      return service.get(id, params)
        .then(item => {
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
          commit('unsetGetPending')
          return item
        })
        .catch(error => {
          commit('setGetError', error)
          commit('unsetGetPending')
          return Promise.reject(error)
        })
    },

    create ({ commit, dispatch }, dataOrArray) {
      let data
      let params

      if (Array.isArray(dataOrArray)) {
        data = dataOrArray[0]
        params = dataOrArray[1]
      } else {
        data = dataOrArray
      }

      commit('setCreatePending')

      console.log('dataOrArray', dataOrArray)

      return service.create(data, params)
        .then(item => {
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
          commit('unsetCreatePending')
          return item
        })
        .catch(error => {
          commit('setCreateError', error)
          commit('unsetCreatePending')
          return Promise.reject(error)
        })
    },

    update ({ commit, dispatch }, [id, data, params]) {
      commit('setUpdatePending')

      return service.update(id, data, params)
        .then(item => {
          dispatch('addOrUpdate', item)
          commit('unsetUpdatePending')
          return item
        })
        .catch(error => {
          commit('setUpdateError', error)
          commit('unsetUpdatePending')
          return Promise.reject(error)
        })
    },

    patch ({ commit, dispatch }, [id, data, params]) {
      commit('setPatchPending')

      return service.patch(id, data, params)
        .then(item => {
          dispatch('addOrUpdate', item)
          commit('unsetPatchPending')
          return item
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
          toAdd[index] = new service.Model(item)
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

      if (service.Model && !existingItem) {
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
