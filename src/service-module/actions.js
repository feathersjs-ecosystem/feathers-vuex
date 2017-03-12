export default function makeServiceActions (service) {
  const { vuexOptions } = service
  const idField = vuexOptions.module.idField || vuexOptions.global.idField
  const serviceActions = {
    find ({ commit, dispatch }, params) {
      commit('setFindPending')
      const handleResponse = response => {
        commit('unsetFindPending')
        let data = response.data || response
        data.map(item => dispatch('addOrUpdate', item))
        return response
      }
      const request = service.find(params)
        .catch(error => {
          commit('unsetFindPending')
          commit('setFindError', error)
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
          commit('unsetGetPending')
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
          return item
        })
        .catch(error => {
          commit('unsetGetPending')
          commit('setGetError', error)
          return error
        })
    },

    create ({ commit, dispatch }, data) {
      commit('setCreatePending')
      return service.create(data)
        .then(item => {
          commit('unsetCreatePending')
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
          return item
        })
        .catch(error => {
          commit('unsetCreatePending')
          commit('setCreateError', error)
          return error
        })
    },

    update ({ commit, dispatch }, id, data) {
      commit('setUpdatePending')
      return service.update(id, data)
        .then(item => {
          commit('unsetUpdatePending')
          dispatch('addOrUpdate', item)
          return item
        })
        .catch(error => {
          commit('unsetUpdatePending')
          commit('setUpdateError', error)
          return error
        })
    },

    patch ({ commit, dispatch }, id, data) {
      commit('setPatchPending')
      return service.patch(id, data)
        .then(item => {
          commit('unsetPatchPending')
          dispatch('addOrUpdate', item)
          return item
        })
        .catch(error => {
          commit('unsetPatchPending')
          commit('setPatchError', error)
          return error
        })
    },

    remove ({ commit, dispatch }, id) {
      commit('setRemovePending')
      return service.remove(id)
        .then(item => {
          commit('unsetRemovePending')
          dispatch('removeItem', item)
          return item
        })
        .catch(error => {
          commit('unsetRemovePending')
          commit('setRemoveError', error)
          return error
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
