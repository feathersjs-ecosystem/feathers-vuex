import { Service } from '@feathersjs/feathers'
import { Params, Paginated } from '../utils'
import { Id } from '@feathersjs/feathers'
import { EventEmitter } from 'events'

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

export interface ModelInstanceOptions {
  clone?: boolean
  commit?: boolean
  merge?: boolean
}

type Model<D> = ModelInstance<D> & Readonly<D>
type ModelClone<D> = ModelInstance<D> & D

/** Static Model interface */
export interface ModelStatic<D = any> extends EventEmitter {
  readonly servicePath: string
  readonly namespace: string
  readonly keepCopiesInStore: boolean
  readonly store: Record<string, any>
  readonly idField: string
  readonly tempIdField: string
  readonly preferUpdate: boolean
  readonly serverAlias: string
  readonly modelName: string

  readonly models: {
    [key: string]: ModelStatic<any> | undefined
  }
  readonly copiesById: {
    [key: string]: Model<D> | undefined
    [key: number]: Model<D> | undefined
  }

  new (data?: Partial<D>, options?: ModelInstanceOptions): Model<D>

  instanceDefaults(data: Partial<D>, ctx: any): Partial<D>
  setupInstance(data: Partial<D>, ctx: any): Partial<D>
  diffOnPatch(data: Partial<D>): Partial<D>

  find(params?: Params): Promise<Model<D>[] | Paginated<Model<D>>>
  findInStore(params?: Params): Model<D>[] | Paginated<Model<D>>

  get(id: Id, params?: Params): Promise<Model<D> | undefined>
  getFromStore(id: Id, params?: Params): Model<D> | undefined

  hydrateAll(): void
}

/** Model instance interface */
export interface ModelInstance<D = any> {
  readonly __id: string
  readonly __isTemp: boolean
  readonly __isClone: boolean

  clone(data?: Partial<D>): ModelClone<D>
  commit(): this
  create(): Promise<this>
  patch(): Promise<this>
  remove(): Promise<this>
  reset(): this
  update(): Promise<this>
  save(): Promise<this>
  toJON(): D
}
