import { createStore } from 'vuex'

import tasks from './services/tasks'

export const store = createStore({
  state: {},
  mutations: {},
  actions: {},
  plugins: [tasks],
})

window.store = store
