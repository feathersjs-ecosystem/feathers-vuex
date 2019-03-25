/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import _omit from 'lodash.omit'
import _pick from 'lodash.pick'

import makeDefaultState from './module.state'
import makeGetters from './module.getters'
import makeMutations from './module.mutations'
import makeActions from './module.actions'

export default function makeServiceModule(service, options) {
  const nonStateProps = [
    'Model',
    'service',
    'state',
    'getters',
    'mutations',
    'actions'
  ]
  const stateOptions = _omit(options, nonStateProps)
  const nonStateOptions = _pick(options, nonStateProps)

  const defaultState = makeDefaultState(stateOptions.servicePath, stateOptions)
  const defaultGetters = makeGetters()
  const defaultMutations = makeMutations(stateOptions.servicePath, options)
  const defaultActions = makeActions(service, options)

  Object.assign(stateOptions, {
    modelName: options.Model.name
  })

  return {
    namespaced: true,
    state: Object.assign(stateOptions, defaultState, nonStateOptions.state),
    getters: Object.assign({}, defaultGetters, options.getters),
    mutations: Object.assign({}, defaultMutations, options.mutations),
    actions: Object.assign({}, defaultActions, options.actions)
  }
}
