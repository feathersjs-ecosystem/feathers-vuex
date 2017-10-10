import setupServiceModule from './service-module/service-module'
import setupAuthModule from './auth-module/auth-module'
import { initAuth } from './utils'

const globalDefaults = {
  idField: 'id', // The field in each record that will contain the id
  autoRemove: false, // automatically remove records missing from responses (only use with feathers-rest)
  nameStyle: 'short' // Determines the source of the module name. 'short', 'path', or 'explicit'
}

export { initAuth }

export default function (feathersClient, globalOptions = {}) {
  globalOptions = Object.assign({}, globalDefaults, globalOptions)

  return {
    service: setupServiceModule(feathersClient, globalOptions),
    auth: setupAuthModule(feathersClient, globalOptions)
  }
}
