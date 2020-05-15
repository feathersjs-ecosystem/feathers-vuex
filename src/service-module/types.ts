import { Service } from '@feathersjs/feathers'
import { Params, Paginated } from '../utils'
import { Id } from '@feathersjs/feathers'
import { EventEmitter } from 'events'
import { FeathersVuexStoreState, FeathersVuexGlobalModels } from '..'
import { Store } from 'vuex'

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

interface PatchParams<D> extends Params {
  data: Partial<D>
}

declare module '..' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface FeathersVuexStoreState {
    /** Allow clients to augment store state */
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface FeathersVuexGlobalModels {
    /** Allow clients to augment Global models */
  }
}

export interface ModelSetupContext {
  /**
   * The global Vuex store
   */
  store: FeathersVuexStoreState
  /**
   * The global `models` object
   */
  models: FeathersVuexGlobalModels
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

/**
 * FeathersVuex Model with readonly data props
 */
export type Model<D extends {} = {}> = ModelInstance<D> & Readonly<D>

/**
 * FeathersVuex Model clone with writeable data props
 */
export type ModelClone<D extends {} = {}> = ModelInstanceClone<D> & D

/** Static Model interface */
export interface ModelStatic<D extends {} = {}> extends EventEmitter {
  /**
   * The path passed to `FeathersClient.service()` to create the service
   */
  readonly servicePath: string
  /**
   * Holds the value that was used to register the module with Vuex.
   * This will match the servicePath unless you've provided a custom
   * namespace in the Service Module plugin options.
   */
  readonly namespace: string
  /**
   * The global Vuex store
   */
  readonly store: Store<FeathersVuexStoreState>
  /**
   * The field in each record that will contain the ID
   */
  readonly idField: string
  /**
   * The field in each temporary record that contains the temporary ID
   */
  readonly tempIdField: string
  /**
   *  If `true`, calling `model.save()` will do an `update` instead of a `patch`.
   */
  readonly preferUpdate: boolean
  /**
   * Server alias in the global `models` object
   */
  readonly serverAlias: string
  /**
   * Model name used to circumvent Babel transpilation errors
   */
  readonly modelName: string
  /**
   * The global `models` object
   */
  readonly models: FeathersVuexGlobalModels
  /**
   * All model copies created using `model.clone()`
   */
  readonly copiesById: {
    [key: string]: Model<D> | undefined
    [key: number]: Model<D> | undefined
  }

  /**
   * Create new Model
   * @param data partial model data
   * @param options model instance options
   */
  new (data?: Partial<D>, options?: ModelInstanceOptions): Model<D>

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
  instanceDefaults(data: Partial<D>, ctx: ModelSetupContext): Partial<D>

  /**
   * A new setupInstance class method is now available in version 2.0.
   * This method allows you to transform the data and setup the final
   * instance based on incoming data. For example, you can access the
   * models object to reference other service Model classes and create
   * data associations.
   * @param data the instance data
   * @param ctx setup context
   */
  setupInstance(data: Partial<D>, ctx: ModelSetupContext): Partial<D>

  /**
   * Gets called just before sending the data to the API server. It gets
   * called with the data and must return the diffed data.
   *
   * Default: `data => data`
   * @param data the instance data
   */
  diffOnPatch(data: Partial<D>): Partial<D>

  /**
   * A proxy for the `find` action
   * @param params Find params
   */
  find(params?: Params): Promise<Model<D>[] | Paginated<Model<D>>>
  /**
   * A proxy for the `find` getter
   * @param params Find params
   */
  findInStore(params?: Params): Model<D>[] | Paginated<Model<D>>

  /**
   * A proxy for the `get` action
   * @param id ID of record to retrieve
   * @param params Get params
   */
  get(id: Id, params?: Params): Promise<Model<D> | undefined>
  /**
   * A proxy for the `get` getter
   * @param id ID of record to retrieve
   * @param params Get params
   */
  getFromStore(id: Id, params?: Params): Model<D> | undefined
}

/** Model instance interface */
export interface ModelInstance<D extends {} = {}> {
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
   * Creates a deep copy of the record and stores it on
   * `Model.copiesById`. This allows you to make changes
   * to the clone and not update visible data until you
   * commit or save the data.
   * @param data Properties to modify on the cloned instance
   */
  clone(data?: Partial<D>): ModelClone<D>
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
  patch(params?: PatchParams<D>): Promise<this>
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
}

/** Model instance clone interface */
export interface ModelInstanceClone<D extends {} = {}>
  extends ModelInstance<D> {
  /**
   * Commit changes from clone to original
   */
  commit(): Model<D>

  /**
   * Discards changes made on this clone and syncs with the original
   */
  reset(): this
}
