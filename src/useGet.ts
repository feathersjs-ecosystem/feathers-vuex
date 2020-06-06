/*
eslint
@typescript-eslint/no-explicit-any: 0
*/
import {
  reactive,
  computed,
  toRefs,
  isRef,
  watch,
  Ref
} from '@vue/composition-api'
import { Params } from './utils'
import { AnyData, ModelStatic, Model, Id } from './service-module/types'

interface UseGetOptions {
  model: ModelStatic
  id: null | string | number | Ref<null> | Ref<string> | Ref<number>
  params?: Params | Ref<Params>
  queryWhen?: Ref<boolean>
  local?: boolean
  lazy?: boolean
}
interface UseGetState {
  isPending: boolean
  hasBeenRequested: boolean
  hasLoaded: boolean
  error: null | Error
  isLocal: boolean
}
interface UseGetData<M> {
  item: Ref<Readonly<M | null>>
  servicePath: Ref<string>
  isPending: Ref<boolean>
  hasBeenRequested: Ref<boolean>
  hasLoaded: Ref<boolean>
  isLocal: Ref<boolean>
  error: Ref<Error>
  get(id: Id, params?: Params): Promise<M | undefined>
}

export default function get<M extends Model = Model>(options: UseGetOptions): UseGetData<M> {
  const defaults: UseGetOptions = {
    model: null,
    id: null,
    params: null,
    queryWhen: computed((): boolean => true),
    local: false,
    lazy: false
  }
  const { model, id, params, queryWhen, local, lazy } = Object.assign(
    {},
    defaults,
    options
  )

  function getId(): null | string | number {
    return isRef(id) ? id.value : id || null
  }
  function getParams(): Params {
    return isRef(params) ? params.value : params
  }

  const state = reactive<UseGetState>({
    isPending: false,
    hasBeenRequested: false,
    hasLoaded: false,
    error: null,
    isLocal: local
  })

  const computes = {
    item: computed(() => {
      const getterId = isRef(id) ? id.value : id
      const getterParams = isRef(params)
        ? Object.assign({}, params.value)
        : params == null
        ? params
        : { ...params }
      return model.getFromStore<M>(getterId, getterParams) || null
    }),
    servicePath: computed(() => model.servicePath)
  }



  function get(id: Id, params?: Params): Promise<M | undefined> {
    const idToUse = isRef<Id>(id) ? id.value : id
    const paramsToUse = isRef(params) ? params.value : params

    if (idToUse != null && queryWhen.value && !state.isLocal) {
      state.isPending = true
      state.hasBeenRequested = true

      const promise =
        paramsToUse != null
          ? model.get(idToUse, paramsToUse)
          : model.get(idToUse)

      return promise
        .then(response => {
          state.isPending = false
          state.hasLoaded = true
          return response
        })
        .catch(error => {
          state.isPending = false
          state.error = error
          return error
        })
    } else {
      return Promise.resolve(undefined)
    }
  }

  watch([
    () => getId(),
    () => getParams(),
  ],
    ([id, params]) => {
      get(id as string | number, params as Params)
    },
    { lazy }
  )

  return {
    ...toRefs(state),
    ...computes,
    get
  }
}
