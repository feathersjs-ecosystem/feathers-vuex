import setupMutations from './mutations'
import { mapMutations } from 'vuex'
import { isBrowser } from '../utils'

export default function setupFeathersModule (store, options) {
  if (!options.feathers || !options.feathers.namespace) {
    return () => {}
  }

  const moduleName = options.feathers.namespace

  return feathers => {
    const services = {
      vuex: {}
    }

    if (isBrowser) {
      services.all = feathers.services
    }

    store.registerModule(moduleName, {
      namespaced: true,
      state: {
        services
      },
      mutations: setupMutations(options)
    })

    const { addService } = mapMutations(moduleName, ['addService'])

    return function addToFeathersModule (service) {
      addService.call({$store: store}, service)
    }
  }
}
