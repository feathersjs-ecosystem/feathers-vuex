export default function makeDefaultState (servicePath, options) {
  const { idField, autoRemove, enableEvents, addOnUpsert, diffOnPatch, skipRequestIfExists, preferUpdate, replaceItems } = options
  const state = {
    ids: [],
    keyedById: {},
    copiesById: {},
    currentId: null,
    copy: null,
    idField,
    servicePath,
    autoRemove,
    enableEvents,
    addOnUpsert,
    diffOnPatch,
    skipRequestIfExists,
    preferUpdate,
    replaceItems,
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

  return state
}
