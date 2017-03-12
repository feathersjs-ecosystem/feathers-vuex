export default function makeServiceActions (service) {
  const { vuexOptions } = service
  const idField = vuexOptions.module.idField || vuexOptions.global.idField

  const serviceActions = {
    find ({ commit, dispatch }, params) {
      commit('setFindPending')
      const handleResponse = response => {
        let data = response.data || response
        dispatch('addOrUpdateList', data)
        commit('unsetFindPending')
        return response
      }
      const request = service.find(params)
        .catch(error => {
          commit('setFindError', error)
          commit('unsetFindPending')
          return error
        })
      return request.subscribe ? request.subscribe(handleResponse) : request.then(handleResponse)
    },

    get ({ commit, dispatch }, params) {
      let id
      if (typeof params === 'string' || typeof params === 'number') {
        id = params[idField]
        delete params[idField]
      } else {
        id = params
        params = undefined
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

    create ({ commit, dispatch }, data) {
      commit('setCreatePending')

      return service.create(data)
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

    update ({ commit, dispatch }, id, data) {
      commit('setUpdatePending')

      return service.update(id, data)
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

    patch ({ commit, dispatch }, id, data) {
      commit('setPatchPending')

      return service.patch(id, data)
        .then(item => {
          dispatch('addOrUpdate', item)
          commit('unsetPatchPending')
          return item
        })
        .catch(error => {
          commit('setPatchError', error)
          commit('unsetPatchPending')
          return error
        })
    },

    remove ({ commit, dispatch }, id) {
      commit('setRemovePending')

      return service.remove(id)
        .then(item => {
          dispatch('removeItem', item)
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

  function checkId (id, item) {
    if (id === undefined) {
      throw new Error('No id found for item. Did you set the idField?', item)
    }
  }

  const actions = {
    addOrUpdateList ({ state, commit }, list) {
      let toAdd = []
      let toUpdate = []

      list.forEach(item => {
        let id = item[idField]
        let existingItem = state.keyedById[id]

        checkId(id, item)

        existingItem ? toUpdate.push(item) : toAdd.push(item)
      })

      commit('addItems', toAdd)
      commit('updateItems', toUpdate)
    },
    addOrUpdate ({ state, commit }, item) {
      let id = item[idField]
      let existingItem = state.keyedById[id]

      checkId(id, item)

      existingItem ? commit('updateItem', item) : commit('addItem', item)
    }
  }
  Object.keys(serviceActions).map(method => {
    if (typeof service[method] === 'function') {
      actions[method] = serviceActions[method]
    }
  })
  return actions
}
