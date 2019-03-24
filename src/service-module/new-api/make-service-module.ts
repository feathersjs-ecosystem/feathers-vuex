/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
export default function makeServiceModule(service, options) {
  return {
    namespaced: true,
    state: {
      options
    },
    getters: {},
    mutations: {},
    actions: {}
  }
}
