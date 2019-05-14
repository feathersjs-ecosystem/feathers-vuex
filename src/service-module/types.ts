/*
eslint
@typescript-eslint/no-explicit-any: 0
*/
export interface FeathersVuexOptions {
  serverAlias: string
  addOnUpsert?: boolean
  autoRemove?: boolean
  debug?: boolean
  diffOnPatch?: boolean
  enableEvents?: boolean
  enabledEvents?: EnabledEventsOptions,
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

export interface EnabledEventsOptions {
  created?: Function;
  updated?: Function;
  patched?: Function;
  removed?: Function;
}

export interface MakeServicePluginOptions {
  Model: any
  service: any
  addOnUpsert?: boolean
  diffOnPatch?: boolean
  enableEvents?: boolean
  enabledEvents?: EnabledEventsOptions
  idField?: string
  tempIdField?: string
  nameStyle?: string
  namespace?: string
  preferUpdate?: boolean
  autoRemove?: boolean
  servicePath?: string
  instanceDefaults?: () => {}
  setupInstance?: (data, { models, store }) => {}
  state?: {}
  getters?: {}
  mutations?: {}
  actions?: {}
}
