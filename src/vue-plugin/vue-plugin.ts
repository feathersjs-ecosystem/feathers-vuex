/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import FeathersVuexFind from '../FeathersVuexFind'
import FeathersVuexGet from '../FeathersVuexGet'
import { globalModels } from '../service-module/global-models'

export const FeathersVuex = {
  install(Vue, options = { components: true }) {
    const shouldSetupComponents = options.components !== false

    Vue.$FeathersVuex = globalModels
    Vue.prototype.$FeathersVuex = globalModels

    if (shouldSetupComponents) {
      Vue.component('feathers-vuex-find', FeathersVuexFind)
      Vue.component('feathers-vuex-get', FeathersVuexGet)
    }
  }
}
