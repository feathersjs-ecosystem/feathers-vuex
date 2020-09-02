/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import FeathersVuexFind from '../FeathersVuexFind'
import FeathersVuexGet from '../FeathersVuexGet'
import FeathersVuexFormWrapper from '../FeathersVuexFormWrapper'
import FeathersVuexInputWrapper from '../FeathersVuexInputWrapper'
import FeathersVuexPagination from '../FeathersVuexPagination'
import { globalModels } from '../service-module/global-models'
import { GlobalModels } from '../service-module/types'

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

    Vue.$FeathersVuex = globalModels
    Vue.prototype.$FeathersVuex = globalModels

    if (shouldSetupComponents) {
      Vue.component('FeathersVuexFind', FeathersVuexFind)
      Vue.component('FeathersVuexGet', FeathersVuexGet)
      Vue.component('FeathersVuexFormWrapper', FeathersVuexFormWrapper)
      Vue.component('FeathersVuexInputWrapper', FeathersVuexInputWrapper)
      Vue.component('FeathersVuexPagination', FeathersVuexPagination)
    }
  }
}
