/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import omit from 'lodash.omit'

export default function makeServiceModule(service, options) {
  const stateOptions = omit(options, ['Model', 'service'])
  return {
    namespaced: true,
    state: {
      options: stateOptions
    },
    getters: {},
    mutations: {},
    actions: {}
  }
}
