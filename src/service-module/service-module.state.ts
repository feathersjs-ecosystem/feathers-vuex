/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/

import { omit as _omit, pick as _pick } from 'lodash'

export default function makeDefaultState(servicePath, options) {
  const nonStateProps = [
    'actions',
    'getters',
    'instanceDefaults',
    'Model',
    'mutations',
    'serialize',
    'service',
    'setupInstance',
    'state',
    'actions'
  ]

  const state = {
    ids: [],
    keyedById: {},
    copiesById: {},
    tempsById: {},
    pagination: {},

    modelName: options.Model.name,

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

  const startingState = _omit(options, nonStateProps)

  return Object.assign({}, state, startingState)
}
