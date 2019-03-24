/*
eslint
@typescript-eslint/no-explicit-any: 0
*/
export interface FeathersVuexOptions {
  serverAlias: string
  idField?: string
  nameStyle?: string
  preferUpdate?: boolean
  debug?: boolean
}

export interface MakeServicePluginOptions {
  Model: any
  service: any
  namespace?: string
  servicePath?: string
  state?: {}
  getters?: {}
  mutations?: {}
  actions?: {}
}
