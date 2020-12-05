import { Service, Id } from '@feathersjs/feathers'
import { Params, Paginated } from '../utils'
import { EventEmitter } from 'events'
import { Store } from 'vuex'
import { Ref } from 'vue-demi'

export { Id } from '@feathersjs/feathers'

export type makeServiceMutations = () => {
  addItems: (state: any, items: Array<any>) => void
  updateItems: (state: any, items: Array<any>) => void
  mergeInstance: (state: any, item: any) => void
  merge: (state: any, { dest, source }: { dest: any; source: any }) => void
  addItem(state: any, item: any): void
  updateItem(state: any, item: any): void
  updateTemp: (state: any, { id, tempId }: { id: any; tempId: Id }) => void
  removeItem(state: any, item: any): void
  removeTemps(state: any, temps: Array<Id>): void
  removeItems: (state: any, items: Array<any>) => void
  clearAll(state: any): void
  createCopy: (state: any, id: Id) => void
  resetCopy: (state: any, id: Id) => void
  commitCopy: (state: any, id: Id) => void
  clearCopy: (state: any, id: Id) => void
  updatePaginationForQuery: (
    state: any,
    { qid, response, query }: { qid: String; response: any; query: any }
  ) => void
  clearError(state: any, method: PendingServiceMethodName): void
}

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
  debounceEventsTime?: number
  debounceEventsMaxWait?: number
  nameStyle?: string
  paramsForServer?: string[]
  preferUpdate?: boolean
  replaceItems?: boolean
  skipRequestIfExists?: boolean
  makeServiceMutations
  merge(dest: unknown, source: unknown, blacklist?: string[]): void

  whitelist?: string[]
}

export type PendingServiceMethodName = 'find' | 'get' | 'create' | 'update' | 'patch' | 'remove'
export type PendingIdServiceMethodName = Exclude<PendingServiceMethodName, 'find' | 'get'>

export interface HandleEvents {
  created?: Function
  patched?: Function
  updated?: Function
  removed?: Function
}

export interface ServicePluginExtendOptions {
  store: Store<any>
  module: any
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
  keepCopiesInStore?: boolean
  debounceEventsTime?: number
  debounceEventsMaxWait?: number

  servicePath?: string
  namespace?: string

  whitelist?: string[]
  paramsForServer?: string[]

  instanceDefaults?: () => {}
  setupInstance?: (data: any, { models, store }) => {}
  handleEvents?: HandleEvents

  extend?: (
    options: ServicePluginExtendOptions
  ) => {
    state?: any
    getters?: any
    mutations?: any
    actions?: any
  }
  state?: {}
  getters?: {}
  mutations?: {}
  actions?: {}
  makeMutations?: any
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FeathersVuexStoreState {
  /** Allow clients to augment store state */
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FeathersVuexGlobalModels {
  /** Allow clients to augment Global models */
}

// Alias and default to any if user doesn't augment interfaces
export type StoreState = keyof FeathersVuexStoreState extends never ? any : FeathersVuexStoreState
export type GlobalModels = keyof FeathersVuexGlobalModels extends never
  ? any
  : FeathersVuexGlobalModels

export interface PatchParams<D extends {} = AnyData> extends Params {
  data?: Partial<D>
}

export interface ModelSetupContext {
  /**
   * The global Vuex store
   */
  store: StoreState
  /**
   * The global `models` object
   */
  models: GlobalModels
}

export interface ModelInstanceOptions {
  /**
   * Creating clone?
   *
   * Default: `false`
   */
  clone?: boolean
  /**
   * Add to store
   *
   * Default: `true`
   */
  commit?: boolean
  /**
   * Merge with existing?
   *
   * Default: `true`
   */
  merge?: boolean
}

export type AnyData = { [key: string]: any }

/** Static Model interface */
export interface ModelStatic extends EventEmitter {
  /**
   * The path passed to `FeathersClient.service()` to create the service
   */
  servicePath: string
  /**
   * Holds the value that was used to register the module with Vuex.
   * This will match the servicePath unless you've provided a custom
   * namespace in the Service Module plugin options.
   */
  namespace: string
  /**
   * The global Vuex store
   */
  readonly store: Store<StoreState>
  /**
   * The field in each record that will contain the ID
   */
  idField: string
  /**
   * The field in each temporary record that contains the temporary ID
   */
  tempIdField: string
  /**
   *  If `true`, calling `model.save()` will do an `update` instead of a `patch`.
   */
  preferUpdate: boolean
  /**
   * Server alias in the global `models` object
   */
  serverAlias: string
  /**
   * Model name used to circumvent Babel transpilation errors
   */
  modelName: string
  /**
   * The global `models` object
   */
  readonly models: GlobalModels
  /**
   * All model copies created using `model.clone()`
   */
  readonly copiesById: {
    [key: string]: Model | undefined
    [key: number]: Model | undefined
  }

  /**
   * The BaseModel constructor calls mergeWithAccessors(this, newData).
   * This utility function correctly copies data between both regular
   * objects and Vue.observable instances. If you create a class where
   * you need to do your own merging, you probably don't want
   * mergeWithAccessors to run twice. In this case, you can use the
   * `merge: false` BaseModel instance option to prevent the internal
   * merge. You can then access the mergeWithAccessors method by calling
   * this method like MyModel.merge(this, newData).
   * @param dest destination object
   * @param source source object
   * @param blacklist keys to ignore when merging
   * @example
   * class Todo extends BaseModel {
   *   public constructor(data, options?) {
   *   options.merge = false // Prevent the internal merge
   *   super(data, options)
   *   // ... your custom constructor logic happens here.
   *   // Call the static merge method to do your own merging.
   *   Todo.merge(this, data)
   *   }
   * }
   */
  merge(dest: unknown, source: unknown, blacklist?: string[]): void

  /**
   * Create new Model
   * @param data partial model data
   * @param options model instance options
   */
  new (data?: AnyData, options?: ModelInstanceOptions): Model
  prototype: Model

  /**
   * The instanceDefaults API was created in version 1.7 to prevent
   * requiring to specify data for new instances created throughout
   * the app. Depending on the complexity of the service's "business
   * logic", it can save a lot of boilerplate. Notice that it is
   * similar to the setupInstance method added in 2.0. The instanceDefaults
   * method should ONLY be used to return default values for a new
   * instance. Use setupInstance to handle other transformations on
   * the data.
   * @param data the instance data
   * @param ctx setup context
   */
  instanceDefaults(data: AnyData, ctx: ModelSetupContext): AnyData

  /**
   * A new setupInstance class method is now available in version 2.0.
   * This method allows you to transform the data and setup the final
   * instance based on incoming data. For example, you can access the
   * models object to reference other service Model classes and create
   * data associations.
   * @param data the instance data
   * @param ctx setup context
   */
  setupInstance(data: AnyData, ctx: ModelSetupContext): AnyData

  /**
   * Gets called just before sending the data to the API server. It gets
   * called with the data and must return the diffed data.
   *
   * Default: `data => data`
   * @param data the instance data
   */
  diffOnPatch(data: AnyData): AnyData

  /**
   * A proxy for the `find` action
   * @param params Find params
   */
  find<M extends Model = Model>(params?: Params): Promise<M[] | Paginated<M>>
  /**
   * A proxy for the `find` getter
   * @param params Find params
   */
  findInStore<M extends Model = Model>(params?: Params | Ref<Params>): Paginated<M>

  /**
   * A proxy for the `count` action
   * @param params Find params
   */
  count(params?: Params): Promise<number>
  /**
   * A proxy for the `count` getter
   * @param params Find params
   */
  countInStore(params?: Params | Ref<Params>): number

  /**
   * A proxy for the `get` action
   * @param id ID of record to retrieve
   * @param params Get params
   */
  get<M extends Model = Model>(id: Id, params?: Params): Promise<M | undefined>
  /**
   * A proxy for the `get` getter
   * @param id ID of record to retrieve
   * @param params Get params
   */
  getFromStore<M extends Model = Model>(
    id: Id | Ref<Id>,
    params?: Params | Ref<Params>
  ): M | undefined
}

/** Model instance interface */
export interface Model {
  [key: string]: any
  /**
   * model's temporary ID
   */
  readonly __id?: string
  /**
   * model is temporary?
   */
  readonly __isTemp?: boolean
  /**
   * model is a clone?
   */
  readonly __isClone?: boolean

  /**
   * `Create` is currently pending on this model
   */
  readonly isCreatePending: boolean
  /**
   * `Update` is currently pending on this model
   */
  readonly isUpdatePending: boolean
  /**
   * `Patch` is currently pending on this model
   */
  readonly isPatchPending: boolean
  /**
   * `Remove` is currently pending on this model
   */
  readonly isRemovePending: boolean
  /**
   * Any of `create`, `update` or `patch` is currently pending on this model
   */
  readonly isSavePending: boolean
  /**
   * Any method is currently pending on this model
   */
  readonly isPending: boolean

  /**
   * Creates a deep copy of the record and stores it on
   * `Model.copiesById`. This allows you to make changes
   * to the clone and not update visible data until you
   * commit or save the data.
   * @param data Properties to modify on the cloned instance
   */
  clone(data?: AnyData): this
  /**
   * The create method calls the create action (service method)
   * using the instance data.
   * @param params Params passed to the Feathers client request
   */
  create(params?: Params): Promise<this>
  /**
   * The patch method calls the patch action (service method)
   * using the instance data. The instance's id field is used
   * for the patch id.
   *
   * You can provide an object as `params.data`, and Feathers-Vuex
   * will use `params.data` as the patch data. This allows patching
   * with partial data.
   * @param params Params passed to the Feathers client request
   */
  patch<D extends {} = AnyData>(params?: PatchParams<D>): Promise<this>
  /**
   * The remove method calls the remove action (service method)
   * using the instance data. The instance's id field is used
   * for the remove id.
   * @param params Params passed to the Feathers client request
   */
  remove(params?: Params): Promise<this>
  /**
   * The update method calls the update action (service method)
   * using the instance data. The instance's id field is used for
   * the update id.
   * @param params Params passed to the Feathers client request
   */
  update(params?: Params): Promise<this>
  /**
   * The save method is a convenience wrapper for the create/patch
   * methods, by default. If the records has no _id, the
   * instance.create() method will be used.
   * @param params Params passed to the Feathers client request
   */
  save(params?: Params): Promise<this>

  /**
   * Commit changes from clone to original
   */
  commit(): this

  /**
   * Discards changes made on this clone and syncs with the original
   */
  reset(): this
}
