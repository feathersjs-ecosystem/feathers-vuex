import setupMutations from './mutations'
import { mapMutations } from 'vuex'

export default function setupFeathersModule (store, options) {
  if (!options.feathers || !options.feathers.name) {
    return () => {}
  }
  
  const moduleName = options.feathers.name

  return feathers => {
    store.registerModule(moduleName, {
      namespaced: true,
      state: {
        services: {
          all: feathers.services,
          vuex: {}
        }
      },
      mutations: setupMutations(options)
    })

    const { addService } = mapMutations(moduleName, ['addService'])

    return function addToFeathersModule (service) {
      addService.call({$store: store}, service)
    }
  }
}
