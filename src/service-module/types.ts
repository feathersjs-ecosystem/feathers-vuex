import { Service } from '@feathersjs/feathers'

/*
eslint
@typescript-eslint/no-explicit-any: 0
*/
export interface FeathersVuexOptions {
  serverAlias: string
  addOnUpsert?: boolean
  autoRemove?: boolean
  debug?: boolean
  enableEvents?: boolean
  handleEvents?: HandleEvents
  idField?: string
  tempIdField?: string
  keepCopiesInStore?: boolean
  nameStyle?: string
  paramsForServer?: string[]
  preferUpdate?: boolean
  replaceItems?: boolean
  skipRequestIfExists?: boolean
  whitelist?: string[]
}

export interface HandleEvents {
  created?: Function
  patched?: Function
  updated?: Function
  removed?: Function
}

export interface MakeServicePluginOptions {
  Model: any
  service: Service<any>

  idField?: string
  tempIdField?: string

  addOnUpsert?: boolean
  autoRemove?: boolean
  debug?: boolean
  enableEvents?: boolean
  preferUpdate?: boolean
  replaceItems?: boolean
  skipRequestIfExists?: boolean
  nameStyle?: string

  servicePath?: string
  namespace?: string

  whitelist?: string[]
  paramsForServer?: string[]

  instanceDefaults?: () => {}
  setupInstance?: (data: any, { models, store }) => {}
  handleEvents?: HandleEvents
  state?: {}
  getters?: {}
  mutations?: {}
  actions?: {}
}
