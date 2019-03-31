/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import makeDefaultState from './service-module.state'
import makeGetters from './service-module.getters'
import makeMutations from './service-module.mutations'
import makeActions from './service-module.actions'

export default function makeServiceModule(service, options) {
  const defaultState = makeDefaultState(options.servicePath, options)
  const defaultGetters = makeGetters()
  const defaultMutations = makeMutations()
  const defaultActions = makeActions(service)

  return {
    namespaced: true,
    state: Object.assign(defaultState, options.state),
    getters: Object.assign({}, defaultGetters, options.getters),
    mutations: Object.assign({}, defaultMutations, options.mutations),
    actions: Object.assign({}, defaultActions, options.actions)
  }
}
