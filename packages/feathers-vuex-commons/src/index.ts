import FeathersVuexCount from './components/FeathersVuexCount'
import FeathersVuexFind from './components/FeathersVuexFind'
import FeathersVuexGet from './components/FeathersVuexGet'
import FeathersVuexFormWrapper from './components/FeathersVuexFormWrapper'
import FeathersVuexInputWrapper from './components/FeathersVuexInputWrapper'
import FeathersVuexPagination from './components/FeathersVuexPagination'

import makeFindMixin from './mixins/make-find-mixin'
import makeGetMixin from './mixins/make-get-mixin'

import useFind from './use/useFind'
import useGet from './use/useGet'

import { models, clearModels } from './service-module/global-models'
import makeBaseModel from './service-module/make-base-model'

import { clients, addClient } from './service-module/global-clients'

import prepareMakeServicePlugin from './service-module/make-service-plugin'
import prepareMakeAuthPlugin from './auth-module/make-auth-plugin'
import makeServiceGetters from './service-module/service-module.getters'
import makeServiceState from './service-module/service-module.state'
import enableServiceEvents from './service-module/service-module.events'

import {
  initAuth,
  hydrateApi,
  assignTempId,
  getId,
  getQueryInfo,
  isBaseModelInstance,
  stripSlashes,
} from './utils'

import {
  FeathersVuexOptions,
  HandleEvents,
  Model,
  ModelStatic,
  ModelSetupContext,
  Id,
  FeathersVuexStoreState,
  FeathersVuexGlobalModels,
  GlobalModels,
  PendingServiceMethodName,
  PendingIdServiceMethodName,
} from './service-module/types'
import {
  UseFindOptions,
  UseFindData,
  UseFindState,
  UseGetData,
  UseGetOptions,
  UseGetState,
} from './use/types'
import { ServiceState } from './service-module/service-module.state'
import { AuthState } from './auth-module/types'

export {
  // Components
  FeathersVuexCount,
  FeathersVuexFind,
  FeathersVuexGet,
  FeathersVuexFormWrapper,
  FeathersVuexInputWrapper,
  FeathersVuexPagination,
  // Mixins
  makeFindMixin,
  makeGetMixin,
  // Composition API Utils
  useFind,
  useGet,
  // Models
  models,
  makeBaseModel,
  clearModels,
  // Clients
  clients,
  addClient,
  // Plugin Factories
  prepareMakeServicePlugin,
  prepareMakeAuthPlugin,
  makeServiceGetters,
  makeServiceState,
  enableServiceEvents,
  // Utils
  initAuth,
  hydrateApi,
  assignTempId,
  getId,
  getQueryInfo,
  isBaseModelInstance,
  stripSlashes,
  // Types
  FeathersVuexOptions,
  HandleEvents,
  Model,
  ModelStatic,
  ModelSetupContext,
  Id,
  FeathersVuexStoreState,
  FeathersVuexGlobalModels,
  GlobalModels,
  PendingServiceMethodName,
  PendingIdServiceMethodName,
  // Use types
  UseFindOptions,
  UseFindData,
  UseFindState,
  UseGetData,
  UseGetOptions,
  UseGetState,
  // State
  ServiceState,
  AuthState,
}
