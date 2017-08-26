export default function makeDefaultState (servicePath, { idField, autoRemove, paginate }) {
  const state = {
    ids: [],
    keyedById: {},
    currentId: undefined,
    copy: undefined,
    idField,
    servicePath,
    autoRemove,
    pagination: {},

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnFind: undefined,
    errorOnGet: undefined,
    errorOnCreate: undefined,
    errorOnUpdate: undefined,
    errorOnPatch: undefined,
    errorOnRemove: undefined
  }
  return state
}
