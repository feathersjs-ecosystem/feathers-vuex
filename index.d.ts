import { Application, Query, Params } from "@feathersjs/feathers";
import { StoreOptions, Plugin, Commit, Dispatch, Store } from "vuex";
import Vue, { PluginObject, ComponentOptions } from "vue";
import { Request } from "request";
import { PropsDefinition } from "vue/types/options";

/**
 * default export
 */
declare const FeathersVuexDefault: (client: Application, options: Partial<FeathersVuexOptions>) => FeathersVuexResult;
export default FeathersVuexDefault;

interface FeathersVuexResult {
  service<ModelType = any, IDType = string>(servicePath: string, options?: Partial<FeathersVuexOptions>): Plugin<FeathersVuexServiceState<ModelType, IDType>>;
  auth<UserType>(options?: FeathersVuexAuthOptions): Plugin<FeathersVuexAuthState<UserType>>;
  FeathersVuex: PluginObject<any>;
}

interface FeathersVuexCoreProps {
  /**
   * @default 'id'
   */
  idField: string;
  /**
   * @default false
   */
  autoRemove: boolean;
  /**
   * @default true
   */
  enableEvents: boolean;
  /**
   * @default false
   */
  addOnUpsert: boolean;
  /**
   * @default false
   */
  diffOnPatch: boolean;
  /**
   * @default false
   */
  skipRequestIfExists: boolean;
  /**
   * @default false
   */
  preferUpdate: boolean;
  /**
   * @default false
   */
  replaceItems: boolean;
}
interface FeathersVuexStoreOptions<Store> extends Pick<StoreOptions<Store>, 'state' | 'getters' | 'mutations' | 'actions'> { }

interface FeathersVuexOptions<Store = any> extends FeathersVuexStoreOptions<Store>, FeathersVuexCoreProps {

  /**
   * @default 'path'
   */
  nameStyle?: 'short' | 'path';
  namespace: string;
  apiPrefix: string
  modelName: string;
  instanceDefaults?: any;
  /**
   * @debug false
   */
  debug: boolean;
}

/**
 * Service Model
 */
type GetParams = Exclude<Params, 'paginate'>;
type FindParams = Params;

interface FeathersVuexModelClass<ModelType = any> {
  namespace: string;
  className: string;
  modelName: string;
  store: Store<any>; // todo: Type the VuexStore so we can include it here
  options: FeathersVuexOptions;
  new(data?: Partial<ModelType>, options?: FeathersVuexModelOptions): FeathersVuexModel<ModelType>;
  create: (params?: GetParams) => Promise<FeathersVuexModel<ModelType>>;
  save: (params?: GetParams) => Promise<FeathersVuexModel<ModelType>>;
  patch: (params?: GetParams) => Promise<FeathersVuexModel<ModelType>>;
  update: (params?: GetParams) => Promise<FeathersVuexModel<ModelType>>;
  clone: () => Promise<FeathersVuexModel<ModelType>>;
  reset: () => Promise<FeathersVuexModel<ModelType>>;
  remove: (params?: GetParams) => Promise<FeathersVuexModel<ModelType>>;
}

export type FeathersVuexModel<T> = FeathersVuexModelClass<T> & T;

interface FeathersVuexModelOptions {
  isClone?: boolean;
  skipCommit?: boolean;
}

/**
 * Vue Plugin
 */
type FeathersVuexGlobalModelsIndex<T> = {
  [P in keyof T]: {
    new(data?: Partial<T[P]>, options?: FeathersVuexModelOptions): FeathersVuexModel<T[P]>;
    find: (params?: FindParams) => FeathersVuexModel<T[P]>[];
    findInStore: (params?: FindParams) => FeathersVuexModel<T[P]>[];
    get: (id: any, params?: GetParams) => FeathersVuexModel<T[P]>[];
    getFromStore: (id: any, params?: GetParams) => FeathersVuexModel<T[P]>[];
  };
}

/**
 * $FeathersVuex: FeathersVuexGlobalModelsIndex<Services> = {users: WrapFeathersVuexModel()}
 * ->
 * $FeathersVuex = {
 *   users: typeof FeathersVuexModel<T['users']>
 * }
 *
 * new $FeathersVuex.users()
 */

// This doesn't work because merging this into a string signature isn't a valid type
// Leaving it here so that hopefully someone can figure it out in the future
// type FeathersVuexGlobalModelsByPath<T> = {
//   byServicePath: FeathersVuexGlobalModelsIndex<T>
// }

type FeathersVuexGlobalModels<T = any, P = any> = FeathersVuexGlobalModelsIndex<T> // & FeathersVuexGlobalModelsByPath<P>; // See comment above

/**
 * @description The type for the $FeathersVuex vue plugin. To type this stronger include the
 * following in a typings.d.ts file
 *
 *
 * @example
 * declare module "vue/types/vue" {
 *   import { FeathersVuexGlobalModels } from "feathers-vuex";
 *   interface Vue {
 *     $FeathersVuex: FeathersVuexGlobalModels<Services>;
 *   }
 * }
 *
 * @description Where services is something like this
 * @example
 * interface Services {
 *   users: User
 *   //...
 * }
 *
 * interface User {
 *   name: string;
 *   rating: number;
 *   //...
 * }
 * @description
 * The second generic is for the "byServicePath" property, and can be used in a similar way, just make a
 * ServicesByPath interface, where the key for the service is the path, not the name
 *
 * @example
 * interface Services {
 *   usersPath: User
 *   //...
 * }
 *
 * declare module "vue/types/vue" {
 *   import { FeathersVuexGlobalModels } from "feathers-vuex";
 *   interface Vue {
 *     $FeathersVuex: FeathersVuexGlobalModels<Services, ServicesByPath>;
 *   }
 * }
 *
 */
interface FeathersVuexPluginType extends FeathersVuexGlobalModels { }

declare module "vue/types/vue" {
  interface Vue {
    // $FeathersVuex: FeathersVuexPluginType;
  }
}

/**
 * Auth module factory
 */
interface FeathersVuexAuthOptions<State = FeathersVuexAuthState> extends FeathersVuexStoreOptions<State> {
  userService: string
}

interface FeathersVuexAuthState<UserType = any> {
  accessToken?: string, // The JWT
  payload: Object, // The JWT payload

  isAuthenticatePending: boolean,
  isLogoutPending: boolean,

  errorOnAuthenticate: Error | undefined,
  errorOnLogout: Error | undefined,
  user: UserType
}

interface FeathersVuexServiceState<ModelType = any, IDType = string> extends FeathersVuexCoreProps {
  ids: IDType[],
  keyedById: {
    [i: string]: ModelType
  }, // A hash map, keyed by id of each item
  currentId?: IDType, // The id of the item marked as current
  copy?: ModelType, // A deep copy of the current item
  servicePath: string // The full service path
  paginate: boolean, // Indicates if pagination is enabled on the Feathers service.
  pagination: { [key: string]: ModelType[] }, // Indicates if pagination is enabled on the Feathers service.

  isFindPending: boolean,
  isGetPending: boolean,
  isCreatePending: boolean,
  isUpdatePending: boolean,
  isPatchPending: boolean,
  isRemovePending: boolean,

  errorOnfind: Error | undefined,
  errorOnGet: Error | undefined,
  errorOnCreate: Error | undefined,
  errorOnUpdate: Error | undefined,
  errorOnPatch: Error | undefined,
  errorOnRemove: Error | undefined
}

/**
 * Data Components
 */
export const FeathersVuexFind: ComponentOptions<
  Vue,
  FeathersVuexFindData,
  FeathersVuexFindMethods,
  FeathersVuexFindComputed,
  PropsDefinition<FeathersVuexFindProps>,
  FeathersVuexFindProps>;
export const FeathersVuexGet: ComponentOptions<
  Vue,
  FeathersVuexGetData,
  FeathersVuexGetMethods,
  FeathersVuexGetComputed,
  PropsDefinition<FeathersVuexGetProps>,
  FeathersVuexGetProps>;

interface FeathersVuexFindData {
  isFindPending: boolean;
}

interface FeathersVuexGetMethods {
  findData(): Promise<void>;
  fetchData(): Promise<void>;
}

interface FeathersVuexFindComputed {
  items: any[];
  scope: { [key: string]: any }
  pagination: { [key: string]: any }
}

interface FeathersVuexDataComponentProps {
  service: string;
  query?: any;
  queryWhen?: boolean | ((id: string, ...args: any[]) => boolean);
  fetchQuery: any;
  watch?: string | string[];
  local?: boolean;
  editScope?: ({ item: any, isGetPending: boolean }) => { [key: string]: any };
}
interface FeathersVuexFindProps extends FeathersVuexDataComponentProps {
  qid?: string;
}

interface FeathersVuexGetData {
  isFindPending: boolean;
  isGetPending: boolean;
}
interface FeathersVuexFindMethods {
  getArgs(queryToUse?: any): any[];
  getData(): Promise<void>;
  fetchData(): Promise<void>;
}
interface FeathersVuexGetComputed {
  item: any | null;
  scope: { [key: string]: any }
}
// todo: generic type for scope type, expand edit scope and queryWhen
interface FeathersVuexGetProps extends FeathersVuexDataComponentProps {
  id?: number | string;
}
/**
 * Utilities
 */
export function makeFindMixin(options: MakeFindMixinOptions): (ComponentOptions<Vue> | typeof Vue);
export function makeGetMixin(options: MakeGetMixinOptions): (ComponentOptions<Vue> | typeof Vue);

interface DataComponentOptions {
  /**
   * Service name, either service or name are required
   *
   * note: it looks like this can also be a function, but I don't quite understand the effects
   * so I'm not documenting it right now
   */
  service: string;
  /**
   * Service name, either service or name are required
   */
  name?: string;
  params?: Params;
  /**
   * @default () => true
   */
  queryWhen?: boolean | ((params: Params) => boolean);
  /**
   * @default false
   */
  local?: boolean;
  qid?: string | number | symbol;
  debug?: boolean;
  watch: string | boolean | string[];
}

interface MakeFindMixinOptions extends DataComponentOptions {
  fetchQuery?: any;
  items?: any[];
}
interface MakeGetMixinOptions extends DataComponentOptions {
  fetchParams?: Params;
  id?: any;
  item?: any;
}


/**
 * Init Auth
 */
interface InitAuthOptions {
  commit: Commit;
  dispatch: Dispatch;
  req: Request;
  cookieName: string;
  moduleName: string;
  feathersClient: Application;
}
export function initAuth(options: InitAuthOptions): Promise<object>;
