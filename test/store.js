const Vue = require('vue')
const Vuex = require('vuex')

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    increment (state) {
      state.count++
    },
    resetStore (state) {
      Vue.delete(store.state, 'feathersServices')
      Vue.delete(store.state, 'todos')
    }
  }
})

export default store
