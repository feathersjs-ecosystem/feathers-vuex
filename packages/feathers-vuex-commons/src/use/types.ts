import { Ref } from 'vue-demi'
import { ModelStatic } from '../service-module/types'
import { Params, Paginated } from '../utils'

// useFind types
export interface UseFindOptions {
  model: ModelStatic
  params: Params | Ref<Params>
  fetchParams?: Params | Ref<Params>
  queryWhen?: Ref<boolean>
  qid?: string
  local?: boolean
  immediate?: boolean
}
export interface UseFindState {
  debounceTime: null | number
  qid: string
  isPending: boolean
  haveBeenRequested: boolean
  haveLoaded: boolean
  error: null | Error
  latestQuery: null | object
  isLocal: boolean
}
export interface UseFindData<M> {
  items: Ref<Readonly<M[]>>
  servicePath: Ref<string>
  isPending: Ref<boolean>
  haveBeenRequested: Ref<boolean>
  haveLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  qid: Ref<string>
  debounceTime: Ref<number>
  latestQuery: Ref<object>
  paginationData: Ref<object>
  error: Ref<Error>
  find(params?: Params | Ref<Params>): Promise<M[] | Paginated<M>>
}

// useGet types
export interface UseGetOptions {
  model: ModelStatic
  id: null | string | number | Ref<null> | Ref<string> | Ref<number>
  params?: Params | Ref<Params>
  queryWhen?: Ref<boolean>
  local?: boolean
  immediate?: boolean
}
export interface UseGetState {
  isPending: boolean
  hasBeenRequested: boolean
  hasLoaded: boolean
  error: null | Error
  isLocal: boolean
}
export interface UseGetData<M> {
  item: Ref<Readonly<M | null>>
  servicePath: Ref<string>
  isPending: Ref<boolean>
  hasBeenRequested: Ref<boolean>
  hasLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  error: Ref<Error>
  get(id: Id, params?: Params): Promise<M | undefined>
}
