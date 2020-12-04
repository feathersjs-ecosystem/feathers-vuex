/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import {
  FeathersVuexFind,
  FeathersVuexGet,
  FeathersVuexFormWrapper,
  FeathersVuexInputWrapper,
  FeathersVuexPagination,
  FeathersVuexCount,
  models,
  GlobalModels
} from '@feathersjs/vuex-commons'

// Augment global models onto VueConstructor and instance
declare module 'vue/types/vue' {
  interface VueConstructor {
    $FeathersVuex: GlobalModels
  }
  interface Vue {
    $FeathersVuex: GlobalModels
  }
}

export const FeathersVuex = {
  install(Vue, options = { components: true }) {
    const shouldSetupComponents = options.components !== false

    // Make $fv available on Vue
    Vue.$FeathersVuex = models
    Vue.$fv = models

    // Make $fv available on component instances
    Vue.prototype.$FeathersVuex = models
    Vue.prototype.$fv = models

    if (shouldSetupComponents) {
      Vue.component('FeathersVuexFind', FeathersVuexFind)
      Vue.component('FeathersVuexGet', FeathersVuexGet)
      Vue.component('FeathersVuexFormWrapper', FeathersVuexFormWrapper)
      Vue.component('FeathersVuexInputWrapper', FeathersVuexInputWrapper)
      Vue.component('FeathersVuexPagination', FeathersVuexPagination)
      Vue.component('FeathersVuexCount', FeathersVuexCount)
    }
  }
}
