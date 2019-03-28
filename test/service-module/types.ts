/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
// TODO: use this in the src
export interface ServiceState {
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
  keyedById: {}
  namespace: string
  nameStyle: string // Should be enum of 'short' or 'path'
  pagination?: {
    default: PaginationState
  }
}

export interface PaginationState {
  ids: any
  limit: number
  skip: number
  ip: number
  total: number
}

export interface Location {
  coordinates: number[]
}
