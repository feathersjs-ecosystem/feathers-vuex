import FeathersVuexData from '../FeathersVuexData'

export default function setupVuePlugin (globalModels) {
  return {
    install (Vue, options = {}) {
      const shouldSetupComponents = options.components !== false

      Vue.$FeathersVuex = globalModels
      Vue.prototype.$FeathersVuex = globalModels

      if (shouldSetupComponents) {
        Vue.component('feathers-vuex-data', FeathersVuexData)
      }
    }
  }
}
