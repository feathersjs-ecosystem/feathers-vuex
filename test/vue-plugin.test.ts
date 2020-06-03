// /*
// eslint
// @typescript-eslint/explicit-function-return-type: 0,
// @typescript-eslint/no-explicit-any: 0
// */
// import { assert } from 'chai'

// // import feathersVuex, { FeathersVuex } from '../src/index'
// import feathersVuex from '../src/index'

// import { feathersRestClient as feathersClient } from './fixtures/feathers-client'
// // import Vue from 'vue/dist/vue'
// import Vuex from 'vuex'

// // Vue.use(Vuex)
// // Vue.use(FeathersVuex)

// interface VueWithFeathers {
//   $FeathersVuex: {}
// }

// function makeContext() {
//   const { makeServicePlugin, BaseModel } = feathersVuex(feathersClient, {
//     serverAlias: 'make-find-mixin'
//   })
//   class FindModel extends BaseModel {
//     public static modelName = 'FindModel'
//     public static test = true
//   }

//   const serviceName = 'todos'
//   const store = new Vuex.Store({
//     plugins: [
//       makeServicePlugin({
//         Model: FindModel,
//         service: feathersClient.service(serviceName)
//       })
//     ]
//   })
//   return {
//     store
//   }
// }

// describe('Vue Plugin', function () {
//   it('Adds the `$FeathersVuex` object to components', function () {
//     const { store } = makeContext()
//     const vm = new Vue({
//       name: 'todos-component',
//       store,
//       template: `<div></div>`
//     }).$mount()

//     assert(vm.$FeathersVuex, 'registeredPlugin correctly')
//   })
// })
