export default function mapActions (service) {
  const { vuexOptions } = service
  const idField = vuexOptions.module.idField || vuexOptions.global.idField
  return {
    find ({ dispatch }, params) {
      service.find(params)
        .then(response => {
          let data = response.data || response
          data.map(item => dispatch('addOrUpdate', item))
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
      service.get(id, params)
        .then(item => {
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
        })
    },

    create ({ commit, dispatch }, data) {
      service.create(data)
        .then(item => {
          dispatch('addOrUpdate', item)
          commit('setCurrent', item)
        })
    },

    update ({ dispatch }, id, data) {
      console.log(id)
      console.log(data)
    },

    patch () {},
    remove () {},

    addOrUpdate ({ state, commit }, item) {
      let id = item[idField]
      let existing = state.keyedById[id]
      existing ? commit('updateItem', item) : commit('addItem', item)
    }
  }
}
