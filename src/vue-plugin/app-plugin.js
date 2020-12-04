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
import FeathersVuexCount from '../FeathersVuexCount'
import { globalModels } from '../service-module/global-models'
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

export const FeathersVuexApp = {
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
