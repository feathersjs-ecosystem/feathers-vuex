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
  GlobalModels,
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
  install(Vue, options = { components: true, alias: '$fv' }) {
    const shouldSetupComponents = options.components !== false

    // Make available on Vue
    Vue.$FeathersVuex = models
    Vue[options.alias] = models

    // Make available on component instances
    Vue.prototype.$FeathersVuex = models
    Vue.prototype[options.alias] = models

    if (shouldSetupComponents) {
      Vue.component('FeathersVuexFind', FeathersVuexFind)
      Vue.component('FeathersVuexGet', FeathersVuexGet)
      Vue.component('FeathersVuexFormWrapper', FeathersVuexFormWrapper)
      Vue.component('FeathersVuexInputWrapper', FeathersVuexInputWrapper)
      Vue.component('FeathersVuexPagination', FeathersVuexPagination)
      Vue.component('FeathersVuexCount', FeathersVuexCount)
    }
  },
}
