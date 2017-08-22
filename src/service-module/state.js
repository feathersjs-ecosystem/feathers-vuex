export default function makeDefaultState (service, { idField, autoRemove }) {
  const state = {
    ids: [],
    keyedById: {},
    currentId: undefined,
    copy: undefined,
    idField,
    autoRemove,

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
