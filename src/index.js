import setupServiceModule from './service-module/service-module'
import setupAuthModule from './auth-module/auth-module'
import setupVuePlugin from './vue-plugin/vue-plugin'
import FeathersVuexFind from './FeathersVuexFind'
import FeathersVuexGet from './FeathersVuexGet'
import makeFindMixin from './make-find-mixin'
import makeGetMixin from './make-get-mixin'
import { initAuth } from './utils'

const globalDefaults = {
  idField: 'id', // The field in each record that will contain the id
  autoRemove: false, // automatically remove records missing from responses (only use with feathers-rest)
  nameStyle: 'short', // Determines the source of the module name. 'short', 'path', or 'explicit'
  apiPrefix: '' // Setting to 'api1/' will prefix the store moduleName, unless `namespace` is used, then this is ignored.
}
const globalModels = {
  byServicePath: {}
}

export { initAuth, FeathersVuexFind, FeathersVuexGet, makeFindMixin, makeGetMixin }

export default function (feathersClient, globalOptions = {}) {
  globalOptions = Object.assign({}, globalDefaults, globalOptions)

  return {
    service: setupServiceModule(feathersClient, globalOptions, globalModels),
    auth: setupAuthModule(feathersClient, globalOptions, globalModels),
    FeathersVuex: setupVuePlugin(globalModels),
    FeathersVuexFind,
    FeathersVuexGet
  }
}
