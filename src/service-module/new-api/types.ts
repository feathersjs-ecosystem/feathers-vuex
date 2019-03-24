/*
eslint
@typescript-eslint/no-explicit-any: 0
*/
export interface GlobalOptions {
  serverAlias: string
  idField?: string
}

export interface MakeServicePluginOptions {
  servicePath: string
  Model: any
  service: any
  namespace?: string
}

export interface MakeModelOptions extends GlobalOptions {}
