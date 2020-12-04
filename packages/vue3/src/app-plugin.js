/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import FeathersVuexFind from '@feathersjs/vuex-commons/components/FeathersVuexFind'
import FeathersVuexGet from '@feathersjs/vuex-commons/components/FeathersVuexGet'
import FeathersVuexFormWrapper from '@feathersjs/vuex-commons/components/FeathersVuexFormWrapper'
import FeathersVuexInputWrapper from '@feathersjs/vuex-commons/components/FeathersVuexInputWrapper'
import FeathersVuexPagination from '@feathersjs/vuex-commons/components/FeathersVuexPagination'
import FeathersVuexCount from '@feathersjs/vuex-commons/components/FeathersVuexCount'
import { globalModels } from '@feathersjs/vuex-commons/service-module/global-models'
// import { GlobalModels } from '../service-module/types'

// Augment global models onto VueConstructor and instance
// declare module 'vue/types/vue' {
//   interface VueConstructor {
//     $FeathersVuex: GlobalModels
//   }
//   interface Vue {
//     $FeathersVuex: GlobalModels
//   }
// }

export const FeathersVuex = {
  install(app, options = { components: true }) {
    const shouldSetupComponents = options.components !== false

    // Make $fv available on app instance
    app.config.globalProperties.$FeathersVuex = globalModels
    app.config.globalProperties.$fv = globalModels

    if (shouldSetupComponents) {
      app.component('FeathersVuexFind', FeathersVuexFind)
      app.component('FeathersVuexGet', FeathersVuexGet)
      app.component('FeathersVuexFormWrapper', FeathersVuexFormWrapper)
      app.component('FeathersVuexInputWrapper', FeathersVuexInputWrapper)
      app.component('FeathersVuexPagination', FeathersVuexPagination)
      app.component('FeathersVuexCount', FeathersVuexCount)
    }
  }
}
