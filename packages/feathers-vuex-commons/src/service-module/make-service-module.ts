/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import _pick from 'lodash/pick'
import _merge from 'lodash/merge'
import makeDefaultState from './service-module.state'
import makeGetters from './service-module.getters'
import makeActions from './service-module.actions'
import { Service } from '@feathersjs/feathers'
import { MakeServicePluginOptions } from './types'
import { Store } from 'vuex'

export default function makeServiceModule(
  service: Service<any>,
  options: MakeServicePluginOptions,
  store: Store<any>,
  model: any
) {
  const fromOptions = _pick(options, ['state', 'getters', 'mutations', 'actions'])
  const defaults = {
    namespaced: true,
    state: makeDefaultState(options),
    getters: makeGetters({ model }),
    mutations: options.makeServiceMutations(),
    actions: makeActions({service, options}),
  }
  const merged = _merge({}, defaults, fromOptions)
  const extended = options.extend({ store, module: merged })
  const finalModule = _merge({}, merged, extended)

  return finalModule
}
