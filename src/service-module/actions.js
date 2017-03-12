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
      console.log(id)
      console.log(data)
      commit('setUpdatePending')
          commit('unsetUpdatePending')
          commit('unsetUpdatePending')
    },

    patch ({ commit, dispatch }) {
      commit('setPatchPending')
          commit('unsetPatchPending')
          commit('unsetPatchPending')
    },
    remove ({ commit, dispatch }) {
      commit('setRemovePending')
          commit('unsetRemovePending')
          commit('unsetRemovePending')
    }
  }

  const actions = {
    addOrUpdate ({ state, commit }, item) {
      let id = item[idField]
      if (id === undefined) {
        throw new Error('No id found for item. Did you set the idField?', item)
      }
      let existing = state.keyedById[id]
      existing ? commit('updateItem', item) : commit('addItem', item)
    }
  }
  Object.keys(serviceActions).map(method => {
    if (typeof service[method] === 'function') {
      actions[method] = serviceActions[method]
    }
  })
  return actions
}
