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
  // GlobalModels
} from '@feathersjs/vuex-commons'
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
  install(app, options = { components: true, alias: '$fv' }) {
    const shouldSetupComponents = options.components !== false

    // Make $fv available on app instance
    app.provide('$FeathersVuex', models)
    app.provide(options.alias, models)

    if (shouldSetupComponents) {
      app.component('FeathersVuexFind', FeathersVuexFind)
      app.component('FeathersVuexGet', FeathersVuexGet)
      app.component('FeathersVuexFormWrapper', FeathersVuexFormWrapper)
      app.component('FeathersVuexInputWrapper', FeathersVuexInputWrapper)
      app.component('FeathersVuexPagination', FeathersVuexPagination)
      app.component('FeathersVuexCount', FeathersVuexCount)
    }
  },
}
