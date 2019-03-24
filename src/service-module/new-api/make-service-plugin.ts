/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions, MakeServicePluginOptions } from './types'
import makeServiceModule from './make-service-module'
import { prepareAddModel } from './add-model'
import { makeNamespace, getServicePath } from '../../utils'

const defaults = {
  namespace: '',
  servicePath: '',
  state: {},
  getters: {},
  mutations: {},
  actions: {}
}

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
   * (3) Setup real-time events
   */
  return function makeServicePlugin(config: MakeServicePluginOptions) {
    const options = Object.assign({}, defaults, globalOptions, config)
    const { Model, service, namespace, nameStyle } = options

    // Make sure we get a service path from either the service or the options
    let { servicePath } = options
    if (!servicePath) {
      servicePath = getServicePath(service, Model.name)
    }
    options.servicePath = servicePath

    service.FeathersVuexModel = Model

    return store => {
      // (1^) Create and register the Vuex module
      const vuexNamespace = makeNamespace(namespace, servicePath, nameStyle)
      const module = makeServiceModule(service, options)
      store.registerModule(vuexNamespace, module)

      // (2^) Monkey patch the Model and add to globalModels
      Object.assign(Model, { store, namespace: vuexNamespace, servicePath })
      addModel(Model)

      // (3^) Setup real-time events
      if (options.enableEvents) {
        // Listen to socket events when available.
        service.on('created', item =>
          store.commit(`${namespace}/addItem`, item)
        )
        service.on('updated', item =>
          store.commit(`${namespace}/updateItem`, item)
        )
        service.on('patched', item =>
          store.commit(`${namespace}/updateItem`, item)
        )
        service.on('removed', item =>
          store.commit(`${namespace}/removeItem`, item)
        )
      }
    }
  }
}
