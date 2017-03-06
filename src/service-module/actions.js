export default function mapActions (service) {
  const { vuexOptions } = service
  const idField = vuexOptions.module.idField || vuexOptions.global.idField
  const serviceActions = {
    find ({ commit, dispatch }, params) {
      commit('setPending')
      return service.find(params)
        .then(response => {
          commit('unsetPending')
          let data = response.data || response
          data.map(item => dispatch('addOrUpdate', item))
          return response
        })
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
      commit('setPending')
      return service.get(id, params)
        .then(item => {
          commit('unsetPending')
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
          return item
        })
    },

    create ({ commit, dispatch }, data) {
      commit('setPending')
      return service.create(data)
        .then(item => {
          commit('unsetPending')
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
          return item
        })
    },

    update ({ commit, dispatch }, id, data) {
      commit('setPending')
      commit('unsetPending')
      console.log(id)
      console.log(data)
    },

    patch ({ commit, dispatch }) {
      commit('setPending')
      commit('unsetPending')
    },
    remove ({ commit, dispatch }) {
      commit('setPending')
      commit('unsetPending')
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
