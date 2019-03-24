/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import _omit from 'lodash.omit'
import _pick from 'lodash.pick'

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

  Object.assign(stateOptions, {
    modelName: options.Model.name
  })

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
