export default function setupVuePlugin (globalModels) {
  return {
    install (Vue, options) {
      Vue.$FeathersVuex = globalModels
      Vue.prototype.$FeathersVuex = globalModels
    }
  }
}
