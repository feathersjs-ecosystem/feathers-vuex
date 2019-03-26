/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
export default function makeDefaultState(servicePath, options) {
  const {
    idField,
    autoRemove,
    enableEvents,
    addOnUpsert,
    diffOnPatch,
    serverAlias,
    skipRequestIfExists,
    preferUpdate,
    replaceItems,
    paramsForServer,
    whitelist
  } = options

  const state = {
    ids: [],
    keyedById: {},
    copiesById: {},
    idField,
    servicePath,
    autoRemove,
    enableEvents,
    addOnUpsert,
    diffOnPatch,
    skipRequestIfExists,
    preferUpdate,
    replaceItems,
    serverAlias,
    paramsForServer,
    whitelist,
    pagination: {},

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

  if (enableEvents) {
    Object.assign(state, {
      realtimeLocksById: {
        create: {},
        patch: {},
        update: {},
        remove: {}
      }
    })
  }

  return state
}
