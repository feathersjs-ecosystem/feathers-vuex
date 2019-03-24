/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import makeServiceModule from './make-service-module'
import { makeNamespace } from '../../utils'

/**
 * prepare only wraps the makeServicePlugin to provide the globalOptions.
 * @param globalOptions
 */
export default function prepareMakeServicePlugin(globalOptions) {
  /**
   * Make a Vuex plugin for the provided service. It also attaches the vuex
   * store to the provided Model instance.
   */
  return function makeServicePlugin(required, options?) {
    options = Object.assign({}, globalOptions, options)
    const { servicePath, Model, service } = required
    const { namespace, nameStyle } = options

    return store => {
      options.namespace = makeNamespace(servicePath, { nameStyle, namespace })
      const module = makeServiceModule(service, options)
      store.registerModule(options.namespace, module)
      Model.store = store
    }
  }
}
