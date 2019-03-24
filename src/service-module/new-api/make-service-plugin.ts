/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions, MakeServicePluginOptions } from './types'
import makeServiceModule from './make-service-module'
import { prepareAddModel } from './add-model'
import { makeNamespace, getServicePath } from '../../utils'

/**
 * prepare only wraps the makeServicePlugin to provide the globalOptions.
 * @param globalOptions
 */
export default function prepareMakeServicePlugin(
  globalOptions: FeathersVuexOptions
) {
  const addModel = prepareAddModel(globalOptions)
  /**
   * (1) Make a Vuex plugin for the provided service.
   * (2) Attach the vuex store to the Model.
   */
  return function makeServicePlugin(config: MakeServicePluginOptions) {
    const options = Object.assign({}, globalOptions, config)
    const { Model, service, namespace, nameStyle } = options

    // Make sure we get a service path from either the service or the options
    let { servicePath } = options
    if (!servicePath) {
      servicePath = getServicePath(service, Model.name)
    }
    options.servicePath = servicePath

    return store => {
      // (1^) Create and register the Vuex module
      const vuexNamespace = makeNamespace(namespace, servicePath, nameStyle)
      const module = makeServiceModule(service, options)
      store.registerModule(vuexNamespace, module)

      // (2^) Monkey patch the Model and add to globalModels
      Object.assign(Model, { store, namespace: vuexNamespace, servicePath })
      addModel(Model)
    }
  }
}
