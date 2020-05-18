/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/

import _omit from 'lodash/omit'

import { MakeServicePluginOptions, AnyData, Model } from './types'

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
  modelName?: string
}

export interface ServiceState<D extends AnyData = AnyData> {
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
    [k: string]: Model<D>
    [k: number]: Model<D>
  }
  tempsById: {
    [k: string]: Model<D>
    [k: number]: Model<D>
  }
  copiesById: {
    [k: string]: Model<D>
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
    'state',
    'getters',
    'mutations',
    'actions'
  ]

  const state: ServiceStateExclusiveDefaults = {
    ids: [],
    keyedById: {},
    copiesById: {},
    tempsById: {}, // Really should be called tempsByTempId
    pagination: {
      defaultLimit: null,
      defaultSkip: null
    },

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
    errorOnRemove: null
  }

  if (options.Model) {
    state.modelName = options.Model.modelName
  }

  const startingState = _omit(options, nonStateProps)

  return Object.assign({}, state, startingState)
}
