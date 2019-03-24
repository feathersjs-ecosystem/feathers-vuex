/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { GlobalOptions, MakeServicePluginOptions } from './types'
import makeServiceModule from './make-service-module'
import { getNamespace } from '../../utils'

/**
 * prepare only wraps the makeServicePlugin to provide the globalOptions.
 * @param globalOptions
 */
export default function prepareMakeServicePlugin(globalOptions: GlobalOptions) {
  /**
   * Make a Vuex plugin for the provided service. It also attaches the vuex
   * store to the provided Model instance.
   */
  return function makeServicePlugin(config) {
    const options = Object.assign({}, globalOptions, config)
    const { servicePath, Model, service, namespace, nameStyle } = options

    return store => {
      options.namespace = namespace || getNamespace(servicePath, nameStyle)
      const module = makeServiceModule(service, options)
      store.registerModule(options.namespace, module)
      Model.store = store
    }
  }
}
