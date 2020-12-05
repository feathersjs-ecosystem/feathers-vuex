/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import _omit from 'lodash/omit'

import { MakeServicePluginOptions, Model } from './types'
import { Id } from '@feathersjs/feathers'

export interface ServiceStateExclusiveDefaults {
  ids: string[]

  errorOnFind: any
  errorOnGet: any
  errorOnCreate: any
  errorOnPatch: any
  errorOnUpdate: any
  errorOnRemove: any

  isFindPending: boolean
  isGetPending: boolean
  isCreatePending: boolean
  isPatchPending: boolean
  isUpdatePending: boolean
  isRemovePending: boolean

  keyedById: {}
  tempsById: {}
  copiesById: {}
  namespace?: string
  pagination?: {
    defaultLimit: number
    defaultSkip: number
    default?: PaginationState
  }
  paramsForServer: string[]
  modelName?: string
  debounceEventsTime: number
  isIdCreatePending: Id[]
  isIdUpdatePending: Id[]
  isIdPatchPending: Id[]
  isIdRemovePending: Id[]
}

export interface ServiceState<M extends Model = Model> {
  options: {}
  ids: string[]
  autoRemove: boolean
  errorOnFind: any
  errorOnGet: any
  errorOnCreate: any
  errorOnPatch: any
  errorOnUpdate: any
  errorOnRemove: any
  isFindPending: boolean
  isGetPending: boolean
  isCreatePending: boolean
  isPatchPending: boolean
  isUpdatePending: boolean
  isRemovePending: boolean
  idField: string
  tempIdField: string
  keyedById: {
    [k: string]: M
    [k: number]: M
  }
  tempsById: {
    [k: string]: M
    [k: number]: M
  }
  copiesById: {
    [k: string]: M
  }
  whitelist: string[]
  paramsForServer: string[]
  namespace: string
  nameStyle: string // Should be enum of 'short' or 'path'
  pagination?: {
    defaultLimit: number
    defaultSkip: number
    default?: PaginationState
  }
  modelName?: string
  debounceEventsTime: number
  debounceEventsMaxWait: number
  isIdCreatePending: Id[]
  isIdUpdatePending: Id[]
  isIdPatchPending: Id[]
  isIdRemovePending: Id[]
}

export interface PaginationState {
  ids: any
  limit: number
  skip: number
  ip: number
  total: number
  mostRecent: any
}

export default function makeDefaultState(options: MakeServicePluginOptions) {
  const nonStateProps = [
    'Model',
    'service',
    'instanceDefaults',
    'setupInstance',
    'handleEvents',
    'extend',
    'state',
    'getters',
    'mutations',
    'actions',
    'makeServiceMutations',
    'merge',
  ]

  const state: ServiceStateExclusiveDefaults = {
    ids: [],
    keyedById: {},
    copiesById: {},
    tempsById: {}, // Really should be called tempsByTempId
    pagination: {
      defaultLimit: null,
      defaultSkip: null,
    },
    paramsForServer: ['$populateParams'],
    debounceEventsTime: null,

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnFind: null,
    errorOnGet: null,
    errorOnCreate: null,
    errorOnUpdate: null,
    errorOnPatch: null,
    errorOnRemove: null,

    isIdCreatePending: [],
    isIdUpdatePending: [],
    isIdPatchPending: [],
    isIdRemovePending: [],
  }

  if (options.Model) {
    state.modelName = options.Model.modelName
  }

  const startingState = _omit(options, nonStateProps)

  return Object.assign({}, state, startingState)
}
